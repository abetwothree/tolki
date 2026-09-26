import * as Arr from "@tolki/arr";
import { collect, Collection, type CollectionShape } from "@tolki/collection";
import { defineEnum, SortDirection } from "@tolki/enum";
import { Stringable } from "@tolki/str";
import type { DataItems, PathKey } from "@tolki/types";
import {
    InvalidArgumentException,
    isString,
    ItemNotFoundException,
    MultipleItemsFoundException,
    UnexpectedValueException,
} from "@tolki/utils";
import { afterEach, assertType, describe, expect, it, vi } from "vitest";

import {
    TestArrayableObject,
    TestCollectionMapIntoObject,
    TestIterableWithDifferentJsonSerializeObject,
    TestJsonableObject,
    TestJsonSerializeObject,
    TestJsonSerializeToStringObject,
    TestJsonSerializeWithScalarValueObject,
    TestTraversableAndJsonSerializableObject,
} from "./test-classes";

// PHP's strcasecmp(), the comparator the *Using tests pass: 0 for strings equal but for case, else -1 or 1.
const strcasecmp = (a: unknown, b: unknown): number => {
    const left = String(a).toLowerCase();
    const right = String(b).toLowerCase();

    if (left === right) {
        return 0;
    }

    return left < right ? -1 : 1;
};

const strnatcasecmp = (a: unknown, b: unknown): number => {
    if (typeof a === "string" && typeof b === "string") {
        return a.localeCompare(b, undefined, { sensitivity: "base" });
    }

    return 0;
};

const strrev = (s: string): string => {
    return s.split("").reverse().join("");
};

// Laravel's test fixture enums (Illuminate\Tests\Support\Fixtures), as @tolki/enum defines them.
const TestEnum = defineEnum({ A: "A", backed: false, _cases: ["A"] } as const);
const TestBackedEnum = defineEnum({
    A: 1,
    B: 2,
    backed: true,
    _cases: ["A", "B"],
} as const);
const TestStringBackedEnum = defineEnum({
    A: "A",
    B: "B",
    backed: true,
    _cases: ["A", "B"],
} as const);
const StaffEnum = defineEnum({
    Taylor: "Taylor",
    Joe: "Joe",
    James: "James",
    backed: false,
    _cases: ["Taylor", "Joe", "James"],
} as const);

/** CollectionTest's ['foo' => 'bar', 1, 2, 3, 4, 5], whose leading string key only a Map expresses in JS. */
const stringKeyFirst = () =>
    collect(
        new Map<string | number, string | number>([
            ["foo", "bar"],
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 4],
            [4, 5],
        ]),
    );

/** PHP's [2 => 'c', 0 => 'a', 1 => 'b'], whose integer keys only a Map keeps out of order in JS. */
const outOfOrderKeys = () =>
    collect(
        new Map([
            [2, "c"],
            [0, "a"],
            [1, "b"],
        ]),
    );

/** A collection's three views, which a keyed result has to agree on. */
const viewsOf = <
    TValue,
    TKey extends PropertyKey,
    TShape extends CollectionShape,
>(
    collection: Collection<TValue, TKey, TShape>,
) => ({
    all: collection.all(),
    keys: collection.keys().all(),
    values: collection.values().all(),
});

describe("Collection", () => {
    describe("assert constructor types", () => {
        it("arrays", () => {
            const arrColl = collect([{ foo: 1 }, { try: 5 }]);

            assertType<Collection<[{ foo: number }, { try: number }], number>>(
                // @ts-expect-error - Collection infers union of element types, not tuple
                arrColl,
            );

            const arr = new Collection([{ foo: 1 }, { try: 5 }]);

            assertType<Collection<[{ foo: number }, { try: number }], number>>(
                // @ts-expect-error - Collection infers union of element types, not tuple
                arr,
            );

            const fromCollection = collect(arrColl);
            assertType<Collection<[{ foo: number }, { try: number }], number>>(
                // @ts-expect-error - Collection infers union of element types, not tuple
                fromCollection,
            );
        });

        it("objects", () => {
            const objColl = collect({ foo: 1 });
            // @ts-expect-error - collect({}) returns Collection<TValue, string> not Collection<{shape}, string>
            assertType<Collection<{ foo: number }, string>>(objColl);

            const obj = new Collection({ foo: 1 });
            // @ts-expect-error - constructor infers Collection<number, "foo"> not Collection<{shape}, string>
            assertType<Collection<{ foo: number }, string>>(obj);

            const fromCollection = collect(objColl);
            // @ts-expect-error - collect(collection) preserves original types
            assertType<Collection<{ foo: number }, string>>(fromCollection);

            const objColl2 = collect({ 1: "a", 2: "b" });
            // @ts-expect-error - collect({}) returns Collection<string, string> not Collection<{shape}, string>
            assertType<Collection<{ 1: string; 2: string }, string>>(objColl2);

            const obj2 = new Collection({ 1: "a", 2: "b" });
            // @ts-expect-error - constructor infers Collection<string, "1"|"2"> not Collection<{shape}, string>
            assertType<Collection<{ 1: string; 2: string }, string>>(obj2);

            const fromCollection2 = collect(objColl2);
            assertType<Collection<{ 1: string; 2: string }, string>>(
                // @ts-expect-error - collect(collection) preserves original types
                fromCollection2,
            );
        });

        it("arrayable", () => {
            const arrayable = {
                toArray: () => [4, 5, 6],
            };
            const collection = collect(arrayable);
            // @ts-expect-error - Arrayable<number> gives Collection<number, number> not Collection<number[], number>
            assertType<Collection<number[], number>>(collection);

            const collection2 = new Collection(arrayable);
            // @ts-expect-error - Arrayable<number> gives Collection<number, number> not Collection<number[], number>
            assertType<Collection<number[], number>>(collection2);

            const fromCollection = collect(collection);
            // @ts-expect-error - preserves original types from source collection
            assertType<Collection<number[], number>>(fromCollection);
        });

        it("map", () => {
            const data = collect(
                new Map([
                    [3, { id: 1, name: "A" }],
                    [5, { id: 3, name: "B" }],
                    [4, { id: 2, name: "C" }],
                ]),
            );

            assertType<
                Collection<{ id: number; name: string }, number, "keyed">
            >(data);
        });
    });

    describe("constructor", () => {
        it("creates empty collection with no arguments", () => {
            // CollectionTest::testConstructMethodFromNull
            const collection = collect();
            expect(collection.all()).toEqual([]);
        });

        it("creates collection from array", () => {
            const collection = collect([1, 2, 3]);
            expect(collection.all()).toEqual([1, 2, 3]);

            const collection2 = collect([]);
            expect(collection2.all()).toEqual([]);
        });

        it("creates collection from object", () => {
            // CollectionTest::testConstructMethodFromArray
            const collection = collect({ a: 1, b: 2 });
            expect(collection.all()).toEqual({ a: 1, b: 2 });
        });

        it("creates collection from null or undefined values", () => {
            // CollectionTest::testConstructMethodFromNull
            const collectionFromNull = collect(null);
            expect(collectionFromNull.all()).toEqual([]);

            const collectionFromUndefined = collect(undefined);
            expect(collectionFromUndefined.all()).toEqual([]);
        });

        it("creates a collection from another collection", () => {
            // CollectionTest::testConstructMethodFromCollection
            const original = collect([1, 2, 3]);
            const collection = collect(original);
            expect(collection.all()).toEqual([1, 2, 3]);
        });

        it("creates a collection from an Arrayable class instance", () => {
            class ArrayableNumbers {
                toArray() {
                    return [4, 5, 6];
                }
            }

            // docs/php-parity/task-26-collection-order.json, "real-arrayable-unwraps-through-toArray"
            const collection = collect(new ArrayableNumbers());
            expect(collection.all()).toEqual([4, 5, 6]);
        });

        it("keeps a plain object's own keys when toArray is merely a member", () => {
            const duckTyped = { toArray: () => [9], b: 2 };

            // docs/php-parity/task-26-collection-order.json, "plain-object-toArray-member-keeps-its-keys"
            expect(collect(duckTyped).keys().all()).toEqual(["toArray", "b"]);

            // docs/php-parity/task-26-collection-order.json, "plain-object-toArray-member-union-keeps-its-keys"
            const united = collect(duckTyped).union({ c: 3 });
            expect(united.keys().all()).toEqual(["toArray", "b", "c"]);

            // docs/php-parity/task-26-collection-order.json, "plain-object-toArray-member-union-keeps-its-values"
            const { toArray, ...rest } = united.all() as Record<
                string,
                unknown
            >;
            expect(rest).toEqual({ b: 2, c: 3 });

            // JS-only: PHP's member is a Closure, which no probe can encode; here it stays the function.
            expect(toArray).toBe(duckTyped.toArray);
        });

        it("creates a collection from a primitive value (string, number, boolean)", () => {
            // CollectionTest::testConstructMethod
            // CollectionTest::testCollectionIsConstructed
            const stringCollection = collect("hello");
            expect(stringCollection.all()).toEqual(["hello"]);

            const numberCollection = collect(42);
            expect(numberCollection.all()).toEqual([42]);

            const booleanCollection = collect(true);
            expect(booleanCollection.all()).toEqual([true]);

            // CollectionTest::testCollectionFromEnum, whose unit case is its name here, so it wraps as a string does
            expect(new Collection(TestEnum.A).toArray()).toEqual([TestEnum.A]);
        });

        it("creates a collection from a Map", () => {
            const data = collect(
                new Map([
                    [3, { id: 1, name: "A" }],
                    [5, { id: 3, name: "B" }],
                    [4, { id: 2, name: "C" }],
                ]),
            );

            // JS-only: a Map stands in for a PHP array whose integer keys are out of order
            expect(data.all()).toEqual({
                3: { id: 1, name: "A" },
                5: { id: 3, name: "B" },
                4: { id: 2, name: "C" },
            });
        });

        it("constructor preserves itemsWithOrder when created from another Collection", () => {
            // JS-only: itemsWithOrder is this port's own record of an order a plain object cannot hold
            // Create a collection via Map with numeric keys to set itemsWithOrder
            const m = new Map<number, { v: string }>([
                [2, { v: "b" }],
                [1, { v: "a" }],
                [3, { v: "c" }],
            ]);
            const base = new Collection(m);
            // @ts-expect-error internal check
            expect(Array.isArray(base.itemsWithOrder)).toBe(true);
            const next = new Collection(base);
            // Ensure itemsWithOrder was preserved by constructor branch
            // @ts-expect-error internal check
            expect(Array.isArray(next.itemsWithOrder)).toBe(true);
            // And data preserved
            expect(next.toJson()).toEqual(base.toJson());
        });

        it("wraps a falsy scalar, as PHP's Arr::wrap does", () => {
            // CollectionTest::testCollectionIsConstructed
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-construct-false"
            expect(new Collection(false).all()).toEqual([false]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-construct-zero"
            expect(new Collection(0).all()).toEqual([0]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-construct-empty-string"
            expect(new Collection("").all()).toEqual([""]);
        });

        it("builds a list from a Set, as PHP builds one from a Traversable", () => {
            // CollectionTest::testCollectionFromTraversable
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-construct-traversable-list"
            const collection = new Collection(new Set([1, 2, 3]));

            expect(collection.all()).toEqual([1, 2, 3]);
            expect(collection.toArray()).toEqual([1, 2, 3]);
            expect(collection.count()).toBe(3);
        });

        it("builds a list from a generator", () => {
            const generator = (function* () {
                yield 1;
                yield 2;
            })();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-construct-generator-list"
            expect(new Collection(generator).all()).toEqual([1, 2]);
        });

        it("builds a keyed collection from a Map, as PHP builds one from a keyed Traversable", () => {
            // CollectionTest::testCollectionFromTraversableWithKeys
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-construct-traversable-keyed"
            const collection = new Collection(
                new Map([
                    ["foo", 1],
                    ["bar", 2],
                    ["baz", 3],
                ]),
            );

            expect(collection.toArray()).toEqual({ foo: 1, bar: 2, baz: 3 });
            expect(collection.keys().all()).toEqual(["foo", "bar", "baz"]);
            expect(collection.values().all()).toEqual([1, 2, 3]);
        });

        it("folds Map keys PHP stores as one into the first one's place, holding the last value", () => {
            const views = (entries: [unknown, string][]) => {
                const collection = new Collection(new Map(entries));

                return {
                    all: collection.all(),
                    keys: collection.keys().all(),
                    values: collection.values().all(),
                    count: collection.count(),
                };
            };

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-construct-colliding-keys"
            expect(
                views([
                    [true, "a"],
                    [1, "b"],
                    [0, "z"],
                ]),
            ).toEqual({
                all: { 1: "b", 0: "z" },
                keys: [1, 0],
                values: ["b", "z"],
                count: 2,
            });
            expect(
                views([
                    [null, "n"],
                    ["", "e"],
                ]),
            ).toEqual({
                all: { "": "e" },
                keys: [""],
                values: ["e"],
                count: 1,
            });
            expect(
                views([
                    [1.5, "f"],
                    [1, "i"],
                ]),
            ).toEqual({ all: { 1: "i" }, keys: [1], values: ["i"], count: 1 });
        });

        it("reads a class instance's own fields as a record, as PHP casts an object", () => {
            class Stub {
                foo = "bar";
            }

            const collection = new Collection(new Stub());

            // CollectionTest::testConstructMethodFromObject
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-construct-stdclass"
            expect(collection.all()).toStrictEqual({ foo: "bar" });
            expect(collection.keys().all()).toEqual(["foo"]);
            expect(collection.values().all()).toEqual(["bar"]);
        });

        it("decodes a Jsonable's toJson()", () => {
            const collection = new Collection(new TestJsonableObject());

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-construct-jsonable"
            expect(collection.all()).toEqual({ foo: "bar" });
            expect(collection.keys().all()).toEqual(["foo"]);
            expect(collection.values().all()).toEqual(["bar"]);
        });

        it("builds an empty collection from a Jsonable whose toJson() is not JSON", () => {
            class NotJson {
                toJson() {
                    return "not-json";
                }
            }

            // JS-only: PHP keeps json_decode's null as the items, which count() then rejects.
            expect(new Collection(new NotJson()).all()).toEqual([]);
        });

        it("lets an error thrown by a Jsonable's toJson() propagate", () => {
            const failure = new Error("toJson failed");

            class ThrowingJson {
                toJson(): string {
                    throw failure;
                }
            }

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-construct-jsonable-toJson-throws"
            expect(() => new Collection(new ThrowingJson())).toThrow(failure);
        });

        it("reads a JsonSerializable's jsonSerialize()", () => {
            const collection = new Collection(new TestJsonSerializeObject());

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-construct-jsonserializable"
            expect(collection.all()).toEqual({ foo: "bar" });
            expect(collection.keys().all()).toEqual(["foo"]);
            expect(collection.values().all()).toEqual(["bar"]);
        });

        it("wraps a JsonSerializable's scalar result", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-construct-jsonserializable-scalar"
            expect(
                new Collection(
                    new TestJsonSerializeWithScalarValueObject(),
                ).all(),
            ).toEqual(["foo"]);
        });

        it("keeps the keys an Arrayable's toArray() returns", () => {
            const collection = new Collection(new TestArrayableObject());

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-construct-arrayable-keyed"
            expect(collection.all()).toEqual({ foo: "bar" });
            expect(collection.keys().all()).toEqual(["foo"]);
            expect(collection.values().all()).toEqual(["bar"]);
        });

        it("iterates a Traversable before serializing it, as PHP does", () => {
            const items = new TestTraversableAndJsonSerializableObject({
                a: 1,
                b: 2,
            });

            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-A-construct-traversable-beats-jsonserializable"
            // JS-only: iteration wins there too, but an iterator yields no keys, so the row's {a: 1, b: 2} is a list.
            expect(new Collection(items).all()).toEqual([1, 2]);
        });

        it("iterates before serializing where the two give different items", () => {
            // JS-only: PHP's fixture iterates and serializes to the same array; this one tells the two apart.
            expect(
                new Collection(
                    new TestIterableWithDifferentJsonSerializeObject(),
                ).all(),
            ).toEqual(["iterated"]);
        });

        it("copies another collection's items, as PHP copies its array", () => {
            const a = collect([1, 2]);
            const b = new Collection(a);
            b.push(3);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-construct-from-collection-copies"
            expect([a.all(), b.all()]).toEqual([
                [1, 2],
                [1, 2, 3],
            ]);
        });

        it("copies the caller's array, as PHP's array is a value", () => {
            const items = [1, 2];
            const collection = new Collection(items);
            collection.push(3);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-construct-from-array-copies"
            expect([items, collection.all()]).toEqual([
                [1, 2],
                [1, 2, 3],
            ]);
        });

        it("copies the caller's object, as PHP's array is a value", () => {
            const items = { a: 1 };
            const collection = new Collection(items);
            collection.put("b", 2);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-construct-from-record-put-copies"
            expect([items, collection.all()]).toEqual([
                { a: 1 },
                { a: 1, b: 2 },
            ]);
            expect(collection.keys().all()).toEqual(["a", "b"]);
            expect(collection.values().all()).toEqual([1, 2]);
        });

        it("keeps its items off its own properties, so an item named then makes no thenable", async () => {
            const collection = collect({ then: () => {}, x: 1 });

            // JS-only: items are read through offsetGet() and get(), never as properties, which await would call
            expect(await collection).toBe(collection);
        });

        it("copies only the top level, so a nested array stays shared", () => {
            const nested = [1];
            const collection = collect([nested]);
            nested.push(2);

            // JS-only: nested arrays are shared; PHP copies them by value
            expect(collection.all()).toEqual([[1, 2]]);
        });
    });

    describe("Symbol.iterator", () => {
        it("makes the collection iterable with for...of", () => {
            // JS-only: for...of is JavaScript's counterpart of PHP's foreach
            const collection = collect([10, 20, 30]);
            const result: number[] = [];
            for (const item of collection) {
                result.push(item);
            }
            expect(result).toEqual([10, 20, 30]);
        });

        it("makes the collection iterable with for...of for object items", () => {
            // JS-only: for...of is JavaScript's counterpart of PHP's foreach
            const collection = collect({ a: 1, b: 2, c: 3 });
            const result: number[] = [];
            for (const item of collection) {
                result.push(item);
            }
            expect(result).toEqual([1, 2, 3]);
        });

        it("hands out getIterator()'s iterator, which is itself iterable", () => {
            const collection = collect([1, 2]);
            const getIterator = vi.spyOn(collection, "getIterator");

            try {
                const seen: number[] = [];

                for (const value of collection) {
                    seen.push(value);
                }

                // JS-only: for...of is JavaScript's foreach, and it reads the iterator getIterator() returns
                expect(getIterator).toHaveBeenCalledOnce();
                expect(seen).toEqual([1, 2]);
                expect(Symbol.iterator in collection[Symbol.iterator]()).toBe(
                    true,
                );
            } finally {
                getIterator.mockRestore();
            }
        });

        it("iterates a snapshot, as PHP's foreach does", () => {
            const collection = collect([1, 2]);
            const seen: number[] = [];

            for (const value of collection) {
                seen.push(value);

                if (seen.length < 5) {
                    collection.push(9);
                }
            }

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-iterator-is-a-snapshot"
            expect([seen, collection.all()]).toEqual([
                [1, 2],
                [1, 2, 9, 9],
            ]);
        });

        it.fails("iterates integer keys in the order PHP keeps them", () => {
            const collection = collect(
                new Map([
                    [2, "a"],
                    [1, "b"],
                ]),
            );

            // Ordered-backing gap: PHP's foreach walks the keys in insertion order, 2 before 1
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-iterate-integer-keys-out-of-order"
            expect([...collection]).toEqual(["a", "b"]);
        });
    });

    describe("test helper classes", () => {
        it("TestArrayableObject implements toArray", () => {
            const obj = new TestArrayableObject();

            // CollectionTest::testGetArrayableItems
            expect(obj.toArray()).toEqual({ foo: "bar" });
        });

        it("TestJsonableObject implements toJson", () => {
            const obj = new TestJsonableObject();
            expect(obj.toJson()).toBe('{"foo":"bar"}');
        });

        it("TestJsonSerializeObject implements jsonSerialize with object", () => {
            const obj = new TestJsonSerializeObject();
            expect(obj.jsonSerialize()).toEqual({ foo: "bar" });
        });

        it("TestJsonSerializeWithScalarValueObject implements jsonSerialize with scalar", () => {
            const obj = new TestJsonSerializeWithScalarValueObject();
            expect(obj.jsonSerialize()).toBe("foo");
        });

        it("TestTraversableAndJsonSerializableObject implements both interfaces", () => {
            const items = [1, 2, 3];
            const obj = new TestTraversableAndJsonSerializableObject(items);

            // Test IteratorAggregate
            const collected: unknown[] = [];
            for (const [index, value] of obj.getIterator()) {
                collected.push(value);
                expect(typeof index).toBe("number");
            }
            expect(collected).toEqual([1, 2, 3]);

            // Test JsonSerializable
            expect(obj.jsonSerialize()).toEqual([1, 2, 3]);
        });

        it("TestJsonSerializeToStringObject implements jsonSerialize returning string", () => {
            const obj = new TestJsonSerializeToStringObject();
            expect(obj.jsonSerialize()).toBe("foobar");
        });

        it("TestCollectionMapIntoObject stores and retrieves value", () => {
            const obj = new TestCollectionMapIntoObject("test value");
            expect(obj.value).toBe("test value");
        });
    });

    describe("range", () => {
        it("throws range()'s ValueError past the maximum array size before it builds an item", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-past-maximum-array-size"
            expect(() => Collection.range(1, 1e19)).toThrow(
                new Error(
                    "The supplied range exceeds the maximum array size by 9999999998926258176.0 elements: start=1.0, end=10000000000000000000.0, step=1.0. Max size: 1073741824",
                ),
            );
        });

        describe("Laravel Tests", () => {
            it("test range method", () => {
                // CollectionTest::testRangeMethod
                expect(Collection.range(1, 5).all()).toEqual([1, 2, 3, 4, 5]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-ascending-through-zero"
                expect(Collection.range(-2, 2).all()).toEqual([
                    -2, -1, 0, 1, 2,
                ]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-ascending-negative"
                expect(Collection.range(-4, -2).all()).toEqual([-4, -3, -2]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-descending"
                expect(Collection.range(5, 1).all()).toEqual([5, 4, 3, 2, 1]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-descending-through-zero"
                expect(Collection.range(2, -2).all()).toEqual([
                    2, 1, 0, -1, -2,
                ]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-descending-negative"
                expect(Collection.range(-2, -4).all()).toEqual([-2, -3, -4]);
            });
        });

        it("creates collection with step", () => {
            const collection = Collection.range(1, 10, 2);
            expect(collection.all()).toEqual([1, 3, 5, 7, 9]);
        });

        it("counts down by the step's size, whatever its sign", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-descending-step"
            expect(Collection.range(10, 1, 3).all()).toEqual([10, 7, 4, 1]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-negative-step-descending"
            expect(Collection.range(5, 1, -2).all()).toEqual([5, 3, 1]);
        });

        it("holds the one item when both ends meet", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-single"
            expect(Collection.range(3, 3).all()).toEqual([3]);
        });

        it("takes a step as long as the span, but no longer", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-step-equals-span"
            expect(Collection.range(0, 10, 10).all()).toEqual([0, 10]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-step-exceeds-span-throws"
            expect(() => Collection.range(1, 2, 3)).toThrow(
                new Error(
                    "range(): Argument #3 ($step) must be less than the range spanned by argument #1 ($start) and argument #2 ($end)",
                ),
            );
        });

        it("computes each float item from the start rather than adding steps up", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-float-step"
            expect(Collection.range(0, 1, 0.1).all()).toEqual([
                0, 0.1, 0.2, 0.30000000000000004, 0.4, 0.5, 0.6000000000000001,
                0.7000000000000001, 0.8, 0.9, 1,
            ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-descending-float-step"
            expect(Collection.range(1, 0, 0.3).all()).toEqual([
                1, 0.7, 0.4, 0.10000000000000009,
            ]);
        });

        it("sizes a float range by rounding half up, then stops at the far end", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-float-size-rounds-half-up"
            expect(Collection.range(0.2, 0.5, 0.1).all()).toEqual([
                0.2, 0.30000000000000004, 0.4, 0.5,
            ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-float-step-stops-at-end"
            expect(Collection.range(0, 1, 0.4).all()).toEqual([0, 0.4, 0.8]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-descending-float-stops-at-end"
            expect(Collection.range(4, 1.5).all()).toEqual([4, 3, 2]);
        });

        it("rejects a zero step", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-step-zero-throws"
            expect(() => Collection.range(1, 5, 0)).toThrow(
                new Error("range(): Argument #3 ($step) cannot be 0"),
            );
        });

        it("rejects a step that is not a finite number", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-non-finite-arguments-throw"
            expect(() => Collection.range(1, 5, NaN)).toThrow(
                new Error(
                    "range(): Argument #3 ($step) must be a finite number, NAN provided",
                ),
            );
            expect(() => Collection.range(1, 5, Infinity)).toThrow(
                new Error(
                    "range(): Argument #3 ($step) must be a finite number, INF provided",
                ),
            );
            expect(() => Collection.range(1, 5, -Infinity)).toThrow(
                new Error(
                    "range(): Argument #3 ($step) must be a finite number, INF provided",
                ),
            );
        });

        it("rejects a start or an end that is not a finite number", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-non-finite-arguments-throw"
            expect(() => Collection.range(NaN, 5)).toThrow(
                new Error(
                    "range(): Argument #1 ($start) must be a finite number, NAN provided",
                ),
            );
            expect(() => Collection.range(0, NaN)).toThrow(
                new Error(
                    "range(): Argument #2 ($end) must be a finite number, NAN provided",
                ),
            );
            expect(() => Collection.range(Infinity, 5)).toThrow(
                new Error(
                    "range(): Argument #1 ($start) must be a finite number, INF provided",
                ),
            );
            expect(() => Collection.range(-Infinity, 5)).toThrow(
                new Error(
                    "range(): Argument #1 ($start) must be a finite number, INF provided",
                ),
            );
            expect(() => Collection.range(0, Infinity)).toThrow(
                new Error(
                    "range(): Argument #2 ($end) must be a finite number, INF provided",
                ),
            );
            expect(() => Collection.range(0, -Infinity)).toThrow(
                new Error(
                    "range(): Argument #2 ($end) must be a finite number, INF provided",
                ),
            );
        });

        it("checks the step before the start and the end", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-checks-the-step-first"
            expect(() => Collection.range(NaN, NaN, NaN)).toThrow(
                new Error(
                    "range(): Argument #3 ($step) must be a finite number, NAN provided",
                ),
            );
            expect(() => Collection.range(NaN, 5, 0)).toThrow(
                new Error("range(): Argument #3 ($step) cannot be 0"),
            );
        });

        it("rejects a negative step on an increasing range", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-range-negative-step-increasing-throws"
            expect(() => Collection.range(1, 5, -1)).toThrow(
                new Error(
                    "range(): Argument #3 ($step) must be greater than 0 for increasing ranges",
                ),
            );
        });
    });

    describe("all", () => {
        it("returns all items as array", () => {
            const items = [1, 2, 3];
            const collection = collect(items);
            expect(collection.all()).toEqual(items);
        });

        it("returns all items as object", () => {
            const items = { a: 1, b: 2, c: 3 };
            const collection = collect(items);
            expect(collection.all()).toEqual(items);
        });

        it("returns the live items, where toArray() returns a copy", () => {
            const collection = collect([1, 2]);
            collection.all()[2] = 3;
            collection.toArray()[3] = 4;

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-all-returns-a-copy"
            // JS-only: all() returns the live backing; toArray() copies
            expect(collection.all()).toEqual([1, 2, 3]);
        });
    });

    describe("median", () => {
        it("test median with no values", () => {
            const collection = collect([]);
            expect(collection.median()).toBe(null);
        });
        it("test median with range", () => {
            const collection = Collection.range(1, 5);
            expect(collection.median()).toBe(3);

            const collection2 = Collection.range(1, 10, 2);
            expect(collection2.median()).toBe(5);
        });
        it("test with objects", () => {
            const collection = collect([
                { value: 1, age: 20 },
                { value: 3, age: 30 },
                { value: 2, age: 25 },
            ]);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-median-rows-without-key"
            expect(collection.median()).toEqual({
                age: 25,
                value: 2,
            });

            expect(collection.median("value")).toBe(2);
            expect(collection.median("age")).toBe(25);
        });
        it("test with arrays", () => {
            const collection = collect([
                [1, 2],
                [3, 4],
                [5, 6],
            ]);
            expect(collection.median()).toEqual([3, 4]);
            expect(collection.median(0)).toBe(3);
            expect(collection.median(1)).toBe(4);
        });
        it("averages the two middle values of an even count", () => {
            const collection = collect([1, 2, 3, 4, 5, 6]);
            expect(collection.median()).toBe(3.5);
        });
        it("sorts numeric strings as numbers, and answers an odd count's middle one as it is", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-median-numeric-strings"
            expect([
                collect(["10", "9", "8"]).median(),
                collect(["10", "9"]).median(),
            ]).toEqual(["9", 9.5]);
        });
        it.fails(
            "sorts a tie in a Map-built collection's insertion order",
            () => {
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-median-out-of-order-tie"
                // Ordered-backing gap: PHP's stable sort keeps the '5' under key 2 ahead of key 0's 5, in the middle
                expect(
                    collect(
                        new Map<number, string | number>([
                            [2, "5"],
                            [0, 5],
                            [1, 1],
                        ]),
                    ).median(),
                ).toBe("5");
            },
        );
        it("reads a key given as an array of path segments", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-median-array-key"
            expect(
                collect([
                    { a: { b: 1 } },
                    { a: { b: 9 } },
                    { a: { b: 5 } },
                ]).median(["a", "b"]),
            ).toBe(5);
        });
        it("skips undefined as it skips null", () => {
            // JS-only: undefined stands for a value PHP does not have, so it is skipped with null, as mode() skips it
            expect([
                collect([1, undefined, 3]).median(),
                collect([1, undefined, 3, 5]).median(),
            ]).toEqual([2, 3]);
        });
        it("throws PHP's TypeError when it averages two middle values that are not numbers", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-median-non-numeric-middle-values"
            expect(() => collect(["b", "a"]).median()).toThrow(
                new TypeError("Unsupported operand types: int + string"),
            );
        });
        it("Laravel tests", () => {
            // CollectionTest::testMedianValueWithArrayCollection, CollectionTest::testMedianValueByKey,
            // CollectionTest::testMedianOnCollectionWithNull, CollectionTest::testEvenMedianCollection,
            // CollectionTest::testMedianOutOfOrderCollection and CollectionTest::testMedianOnEmptyCollectionReturnsNull
            expect(collect([1, 2, 2, 4]).median()).toBe(2);

            expect(
                collect([
                    { foo: 1 },
                    { foo: 2 },
                    { foo: 2 },
                    { foo: 4 },
                ]).median("foo"),
            ).toBe(2);

            expect(
                collect([
                    { foo: 1 },
                    { foo: 2 },
                    { foo: 4 },
                    { foo: null },
                ]).median("foo"),
            ).toBe(2);

            expect(collect([{ foo: 0 }, { foo: 3 }]).median("foo")).toBe(1.5);

            expect(
                collect([{ foo: 0 }, { foo: 5 }, { foo: 3 }]).median("foo"),
            ).toBe(3);

            expect(collect().median()).toBeNull();
        });
    });

    describe("mode", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testModeOnNullCollection, CollectionTest::testMode, CollectionTest::testModeValueByKey
            // and CollectionTest::testWithMultipleModeValues
            expect(collect().mode()).toBeNull();

            const data = collect([1, 2, 3, 4, 4, 5]);
            expect(data.mode()).toBeInstanceOf(Array);
            expect(data.mode()).toEqual([4]);

            const data1 = new Collection([
                { foo: 1 },
                { foo: 1 },
                { foo: 2 },
                { foo: 4 },
            ]);
            const data2 = new Collection([
                { foo: 1 },
                { foo: 1 },
                { foo: 2 },
                { foo: 4 },
            ]);

            expect(data1.mode("foo")).toEqual([1]);
            expect(data2.mode("foo")).toEqual(data1.mode("foo"));

            expect(collect([1, 2, 2, 1]).mode()).toEqual([1, 2]);
        });

        it("handles string keys that are not valid numbers", () => {
            // Create object collection where keys are strings that aren't numeric
            const objData = collect({ a: 1, b: 1, c: 2, d: 2, e: 3 });
            // The mode's keys will be string keys from the object
            // When we use mode with 'a', 'b', 'c', 'd' values appearing with certain frequencies
            // The internal collection keys will be strings
            const result = objData.mode();
            // Both 1 and 2 appear twice (highest count)
            expect(result).toEqual([1, 2]);
        });

        it("handles non-numeric string values in mode", () => {
            // When values are non-numeric strings, mode should return them as strings
            const c = collect(["apple", "banana", "apple", "cherry", "apple"]);
            const result = c.mode();
            // "apple" appears 3 times (most frequent)
            expect(result).toEqual(["apple"]);
        });

        // CollectionTest::testModeOnCollectionWithNull and CollectionTest::testModeOnCollectionWithOnlyNullsReturnsNull
        it("skips null items", () => {
            // docs/php-parity/task-31-laravel-13-33-sync.json, "mode-key-with-nulls", "mode-null-and-value",
            // "mode-only-nulls" and "mode-missing-key"
            expect(
                collect([{ foo: 5 }, { foo: null }, { foo: null }]).mode("foo"),
            ).toEqual([5]);
            expect(collect([null, 3]).mode()).toEqual([3]);
            expect(collect([null, null]).mode()).toBeNull();
            expect(
                collect([{ foo: 5 }, { bar: 1 }, { bar: 2 }]).mode("foo"),
            ).toEqual([5]);
            // JS-only: undefined has no PHP analogue and is skipped with null.
            expect(collect([undefined, 3]).mode()).toEqual([3]);
        });

        it("counts each value under the key PHP stores it as", () => {
            // docs/php-parity/task-31-laravel-13-33-sync.json, "mode-dotted-values", "mode-bools",
            // "mode-numeric-strings" and "mode-empty-string"
            expect(collect(["a.b", "a.b", "c"]).mode()).toEqual(["a.b"]);
            expect(collect([true, true, false]).mode()).toEqual([1]);
            expect(collect(["1", 1, "1"]).mode()).toEqual([1]);
            expect(collect(["", "", "a"]).mode()).toEqual([""]);
        });

        it("lists tied values in the order first seen", () => {
            // docs/php-parity/task-31-laravel-13-33-sync.json, "mode-tie-first-seen", "mode-out-of-order-tie"
            // and "mode-assoc-strings"
            expect(collect([3, 1, 3, 1]).mode()).toEqual([3, 1]);
            expect(
                new Collection(
                    new Map([
                        [2, "c"],
                        [0, "a"],
                    ]),
                ).mode(),
            ).toEqual(["c", "a"]);
            expect(collect({ x: "p", y: "q", z: "q" }).mode()).toEqual(["q"]);
            // docs/php-parity/task-31-laravel-13-33-sync.json, "mode-out-of-order-key-tie"
            expect(
                new Collection(
                    new Map([
                        [2, { foo: "c" }],
                        [0, { foo: "a" }],
                    ]),
                ).mode("foo"),
            ).toEqual(["c", "a"]);
        });
    });

    describe("collapse", () => {
        it("skips a Date item on a list backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-skips-objects"
            expect(
                collect([[1], new Date(0), [2]])
                    .collapse()
                    .all(),
            ).toEqual([1, 2]);
        });

        it("skips a class instance item on an object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-skips-objects"
            class Point {
                x = 1;
                y = 2;
            }

            expect(
                collect({ g1: { a: 1 }, g2: new Point() })
                    .collapse()
                    .all(),
            ).toEqual({ a: 1 });
        });

        it("collapses nested arrays", () => {
            const collection = collect([
                [1, 2],
                [3, 4],
            ]);
            const collapsed = collection.collapse();
            expect(collapsed.all()).toEqual([1, 2, 3, 4]);
        });

        it("ignores non-array items", () => {
            const collection = collect([1, [2, 3], "string", [4, 5]]);
            const collapsed = collection.collapse();
            expect(collapsed.all()).toEqual([2, 3, 4, 5]);
        });

        it("collapses nested objects", () => {
            const collection = collect([
                { a: 1, b: 2 },
                { c: 3, d: 4 },
            ]);
            const collapsed = collection.collapse();
            expect(collapsed.all()).toEqual({ a: 1, b: 2, c: 3, d: 4 });
        });

        it("ignores non-object items", () => {
            const collection = collect([
                1,
                { a: 2, b: 3 },
                "string",
                { c: 4, d: 5 },
            ]);
            const collapsed = collection.collapse();
            expect(collapsed.all()).toEqual({ a: 2, b: 3, c: 4, d: 5 });
        });

        it("Laravel Tests", () => {
            // CollectionTest::testCollapse, with class instances standing in for its stdClass items
            class Item {}
            const object1 = new Item();
            const object2 = new Item();
            const objects = collect([[object1], [object2]])
                .collapse()
                .all();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-collapse-nested-collections": its
            // "objects" count
            expect(objects).toEqual([object1, object2]);
            expect(objects[0]).toBe(object1);
            expect(objects[1]).toBe(object2);

            expect(collect([[], [], []]).collapse().all()).toEqual([]);
            expect(collect([{}, {}, {}]).collapse().all()).toEqual({});

            const data = new Collection([
                [1],
                [2],
                [3],
                ["foo", "bar"],
                new Collection(["baz", "boom"]),
            ]);
            expect(data.collapse().all()).toEqual([
                1,
                2,
                3,
                "foo",
                "bar",
                "baz",
                "boom",
            ]);

            const data2 = new Collection({
                first: new Collection({ a: 1, b: 2 }),
                second: { c: 3, d: 4 },
            });
            expect(data2.collapse().all()).toEqual({ a: 1, b: 2, c: 3, d: 4 });

            expect(
                collect([[], [1, 2], [], ["foo", "bar"]])
                    .collapse()
                    .all(),
            ).toEqual([1, 2, "foo", "bar"]);
        });

        it("test collapse with nested collections", () => {
            // CollectionTest::testCollapseWithNestedCollections
            const data = collect([collect([1, 2, 3]), collect([4, 5, 6])]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-collapse-nested-collections"
            expect(data.collapse().all()).toEqual([1, 2, 3, 4, 5, 6]);
        });

        it("keeps list items beside an object item on a list backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-list-then-map"
            expect(
                collect([[1, 2], { x: 1, 0: "z" }])
                    .collapse()
                    .all(),
            ).toEqual({ 0: 1, 1: 2, 2: "z", x: 1 });
        });

        it("merges a Collection item's items on an object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-assoc-collection-item"
            const result = collect({
                a: collect({ x: 1 }),
                b: { y: 2 },
            }).collapse();

            expect(result.all()).toEqual({ x: 1, y: 2 });
            expect(result.keys().all()).toEqual(["x", "y"]);
            expect(result.values().all()).toEqual([1, 2]);
        });

        it("collapses a record of lists into a list", () => {
            const collapsed = collect({ a: [1, 2], b: [3] }).collapse();

            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-assoc-of-lists"
            expect(collapsed.all()).toEqual([1, 2, 3]);
            expect(collapsed.keys().all()).toEqual([0, 1, 2]);
            expect(collapsed.values().all()).toEqual([1, 2, 3]);
        });

        it("collapses a Map-built collection's items in the order it holds them", () => {
            const collapsed = collect(
                new Map([
                    [2, ["c"]],
                    [0, ["a"]],
                    [1, ["b"]],
                ]),
            ).collapse();

            // docs/php-parity/task-30-map-order.json, "collapse-out-of-order-lists"
            expect(collapsed.all()).toEqual(["c", "a", "b"]);
            expect(collapsed.keys().all()).toEqual([0, 1, 2]);
            expect(collapsed.values().all()).toEqual(["c", "a", "b"]);
        });

        it("collapses a Map-built collection item's items in the order it holds them, into a list", () => {
            const collapsed = collect([
                collect(
                    new Map([
                        [2, "c"],
                        [0, "a"],
                    ]),
                ),
            ]).collapse();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-collapse-out-of-order-collection-item"
            expect(collapsed.all()).toEqual(["c", "a"]);
            expect(collapsed.keys().all()).toEqual([0, 1]);
            expect(collapsed.values().all()).toEqual(["c", "a"]);
        });

        it("renumbers a negative integer key on an object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-negative-int-keys"
            expect(
                collect({ g1: { "-1": "a", k: "b" }, g2: { "-1": "c" } })
                    .collapse()
                    .all(),
            ).toEqual({ 0: "a", 1: "c", k: "b" });
        });
    });

    describe("collapseWithKeys", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testCollapseWithKeys
            const data = collect([{ 1: "a" }, { 3: "c" }, { 2: "b" }, "drop"]);
            expect(data.collapseWithKeys().all()).toEqual({
                1: "a",
                3: "c",
                2: "b",
            });

            const data2 = collect(["a", "b", "c"]);
            expect(data2.collapseWithKeys().all()).toEqual([]);

            // CollectionTest::testCollapseWithKeysOnNestedCollections
            const data3 = collect([
                new Collection({ a: "1a", b: "1b" }),
                new Collection({ b: "2b", c: "2c" }),
                "drop",
            ]);
            expect(data3.collapseWithKeys().all()).toEqual({
                a: "1a",
                b: "2b",
                c: "2c",
            });
        });

        it("test empty collection", () => {
            const data = collect([]);
            expect(data.collapseWithKeys().all()).toEqual([]);
        });

        it("test multi-dimenssional array", () => {
            const data = collect([
                { a: 1, b: 2 },
                { c: 3, d: 4 },
            ]);
            expect(data.collapseWithKeys().all()).toEqual({
                a: 1,
                b: 2,
                c: 3,
                d: 4,
            });

            const data2 = collect([
                [1, 2],
                [3, 4],
            ]);
            expect(data2.collapseWithKeys().all()).toEqual([3, 4]);

            const data3 = collect([
                [1, 2, 5, 6],
                [3, 4],
            ]);
            expect(data3.collapseWithKeys().all()).toEqual([3, 4, 5, 6]);
        });

        it("skips an item that is an object but no plain object, as collapse does", () => {
            const collapsed = collect([[1, 2], new Date(0)]).collapseWithKeys();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-collapseWithKeys-skips-object-item"
            expect(collapsed.all()).toEqual([1, 2]);
            expect(collapsed.keys().all()).toEqual([0, 1]);
            expect(collapsed.values().all()).toEqual([1, 2]);
        });

        it("merges a Map-built collection's items in the order it holds them", () => {
            const collapsed = collect(
                new Map([
                    [2, { c: 1 }],
                    [0, { a: 1 }],
                    [1, { b: 1 }],
                ]),
            ).collapseWithKeys();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-collapseWithKeys-out-of-order"
            expect(collapsed.all()).toEqual({ c: 1, a: 1, b: 1 });
            expect(collapsed.keys().all()).toEqual(["c", "a", "b"]);
            expect(collapsed.values().all()).toEqual([1, 1, 1]);
        });

        it("merges a Map-built collection item's items in the order it holds them", () => {
            const collapsed = collect([
                collect(
                    new Map([
                        [2, "c"],
                        [0, "a"],
                    ]),
                ),
            ]).collapseWithKeys();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-collapseWithKeys-collection-items"
            expect(collapsed.all()).toEqual({ 2: "c", 0: "a" });
            expect(collapsed.keys().all()).toEqual([2, 0]);
            expect(collapsed.values().all()).toEqual(["c", "a"]);
        });

        it("replaces a collection item's list with a later list index by index", () => {
            const collapsed = collect([
                collect([1, 2]),
                [3],
            ]).collapseWithKeys();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-collapseWithKeys-collection-items"
            expect(collapsed.all()).toEqual([3, 2]);
            expect(collapsed.keys().all()).toEqual([0, 1]);
            expect(collapsed.values().all()).toEqual([3, 2]);
        });

        it("collapses an outer collection with string keys", () => {
            // CollectionTest::testCollapseWithKeysWithStringKeys
            // docs/php-parity/task-31-laravel-13-33-sync.json, "collapseWithKeys-string-keys",
            // "collapseWithKeys-mixed-keys" and "collapseWithKeys-string-keys-lists"
            expect(
                Object.entries(
                    collect({ first: { a: 1, b: 2 }, second: { c: 3 } })
                        .collapseWithKeys()
                        .all(),
                ),
            ).toEqual([
                ["a", 1],
                ["b", 2],
                ["c", 3],
            ]);
            expect(
                Object.entries(
                    collect({ 5: { a: 1 }, second: collect({ b: 2, a: 3 }) })
                        .collapseWithKeys()
                        .all(),
                ),
            ).toEqual([
                ["a", 3],
                ["b", 2],
            ]);
            expect(
                collect({ first: [1, 2], second: [3] })
                    .collapseWithKeys()
                    .all(),
            ).toEqual([3, 2]);
        });

        // Only JSON.parse produces a real own enumerable "__proto__" key; a literal
        // `{ __proto__: ... }` sets the prototype at construction time instead.
        describe("with a hostile __proto__ key", () => {
            afterEach(() => {
                expect(
                    ({} as { polluted?: unknown; isAdmin?: unknown }).polluted,
                ).toBeUndefined();
                expect(
                    ({} as { polluted?: unknown; isAdmin?: unknown }).isAdmin,
                ).toBeUndefined();
            });

            // No collapseWithKeys probe exists in docs/php-parity/; this is inferred from
            // the general keyed-Collection merge rule in task-16-final-review.json
            // ('"__proto__" is an ordinary array key in every keyed Collection result').
            it("collapseWithKeys keeps a __proto__ key as data", () => {
                const payload = JSON.parse(
                    '[{"__proto__":{"isAdmin":true}},{"b":2}]',
                );
                const result = new Collection(payload)
                    .collapseWithKeys()
                    .all() as Record<string, unknown>;
                expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
                expect(Object.hasOwn(result, "__proto__")).toBe(true);
                expect(
                    (result as { isAdmin?: unknown }).isAdmin,
                ).toBeUndefined();
            });
        });
    });

    describe("contains", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testContains and CollectionTest::testContainsWithOperator
            const c = new Collection([1, 3, 5]);

            expect(c.contains(1)).toBe(true);
            expect(c.contains("1")).toBe(true);
            expect(c.contains(2)).toBe(false);
            expect(c.contains("2")).toBe(false);

            const d = collect(["1"]);
            expect(d.contains("1")).toBe(true);
            expect(d.contains(1)).toBe(true);

            const e = collect([null]);
            expect(e.contains(false)).toBe(true);
            expect(e.contains(null)).toBe(true);
            expect(e.contains([])).toBe(true);
            expect(e.contains(0)).toBe(true);
            expect(e.contains("")).toBe(true);

            const f = collect([0]);
            expect(f.contains(0)).toBe(true);
            expect(f.contains("0")).toBe(true);
            expect(f.contains(false)).toBe(true);
            expect(f.contains(null)).toBe(true);
            expect(f.contains((item) => item < 5)).toBe(true);
            expect(f.contains((item) => item > 5)).toBe(false);

            const g = collect([{ v: 1 }, { v: 3 }, { v: 5 }]);
            expect(g.contains("v", 1)).toBe(true);
            expect(g.contains("v", 2)).toBe(false);

            const h = collect(["date", "class", { foo: 50 }]);
            expect(h.contains("date")).toBe(true);
            expect(h.contains("class")).toBe(true);
            expect(h.contains("foo")).toBe(false);

            const i = collect([null, 1, 2]);
            expect(i.contains((item) => item === null)).toBe(true);

            const j = collect([{ v: 1 }, { v: 3 }, { v: "4" }, { v: 5 }]);
            expect(j.contains("v", "=", 4)).toBe(true);
            expect(j.contains("v", "==", 4)).toBe(true);
            expect(j.contains("v", "===", 4)).toBe(false);
            expect(j.contains("v", ">", 4)).toBe(true);

            expect(j.contains("v", "!=", 4)).toBe(true);
            expect(j.contains("v", "!==", 4)).toBe(true);
            expect(j.contains("v", "<>", 4)).toBe(true);
            expect(j.contains("v", "<", 4)).toBe(true);

            expect(j.contains("v", "<=", 4)).toBe(true);
            expect(j.contains("v", ">=", 4)).toBe(true);
            expect(j.contains("v", "<=>", 4)).toBe(true);
        });

        it("checks if value exists in array", () => {
            const collection = collect([1, 2, 3]);
            expect(collection.contains(2)).toBe(true);
            expect(collection.contains(4)).toBe(false);
        });

        it("checks if value exists in object", () => {
            const collection = collect({ a: 1, b: 2, c: 3 });
            expect(collection.contains(2)).toBe(true);
            expect(collection.contains(4)).toBe(false);
        });

        it("works with callback in array", () => {
            const data = [{ id: 1 }, { id: 2 }];
            const collection = collect(data);
            expect(collection.contains((item) => item.id === 2)).toBe(true);
            expect(collection.contains((item) => item.id === 3)).toBe(false);
        });

        it("works with callback in object", () => {
            const collection = new Collection({
                a: { id: 1 },
                b: { id: 2 },
            });
            expect(collection.contains((item) => item.id === 2)).toBe(true);
            expect(collection.contains((item) => item.id === 3)).toBe(false);
        });

        it("reads a null second argument as the value the key must equal", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-two-args-null-value"
            expect(collect([{ a: null }, { a: 1 }]).contains("a", null)).toBe(
                true,
            );
            expect(collect([{ a: 1 }]).contains("a", null)).toBe(false);
        });

        it("reads an explicit undefined second argument as PHP's null", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-two-args-null-value":
            // PHP's answer for a null second argument. JS-only: an explicit undefined stands for that null
            expect(
                collect([{ a: null }, { a: 1 }]).contains("a", undefined),
            ).toBe(true);
            expect(collect([{ a: 1 }]).contains("a", undefined)).toBe(false);
        });

        it("compares a unit enum case as the name it is", () => {
            const rows = collect([{ n: StaffEnum.Joe }]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-contains-unit-enum-operand"
            expect([
                rows.contains("n", "Joe"),
                rows.contains("n", StaffEnum.Joe),
                rows.contains("n", "!=", "Joe"),
            ]).toEqual([true, true, false]);
        });

        it.fails(
            "calls a callback in a Map-built collection's insertion order",
            () => {
                const seen: number[] = [];
                outOfOrderKeys().contains((_value, key) => {
                    seen.push(key);

                    return false;
                });

                // Ordered-backing gap: PHP calls the callback in insertion order, key 2 before 0 and 1
                // docs/php-parity/task-30-map-order.json, "contains-out-of-order-callback-order"
                expect(seen).toEqual([2, 0, 1]);
            },
        );
    });

    describe("containsStrict", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testContainsStrict
            const c = new Collection([1, 3, 5, "02"]);
            expect(c.containsStrict(1)).toBe(true);
            expect(c.containsStrict("1")).toBe(false);
            expect(c.containsStrict(2)).toBe(false);
            expect(c.containsStrict("2")).toBe(false);
            expect(c.containsStrict("02")).toBe(true);
            expect(c.containsStrict(true)).toBe(false);
            // @ts-expect-error - operator < on string | number union
            expect(c.containsStrict((item) => item < 5)).toBe(true);
            // @ts-expect-error - operator > on string | number union
            expect(c.containsStrict((item) => item > 5)).toBe(false);

            const d = collect([0]);
            expect(d.containsStrict(0)).toBe(true);
            expect(d.containsStrict("0")).toBe(false);
            expect(d.containsStrict(false)).toBe(false);
            expect(d.containsStrict(null)).toBe(false);

            const e = collect([1, null]);
            expect(e.containsStrict(null)).toBe(true);
            expect(e.containsStrict(0)).toBe(false);
            expect(e.containsStrict(false)).toBe(false);

            const f = collect([{ v: 1 }, { v: 3 }, { v: "04" }, { v: 5 }]);
            expect(f.containsStrict("v", 1)).toBe(true);
            expect(f.containsStrict("v", 2)).toBe(false);
            expect(f.containsStrict("v", "1")).toBe(false);
            expect(f.containsStrict("v", 4)).toBe(false);
            expect(f.containsStrict("v", "04")).toBe(true);

            const g = collect(["date", "class", { foo: 50 }, ""]);
            expect(g.containsStrict("date")).toBe(true);
            expect(g.containsStrict("class")).toBe(true);
            expect(g.containsStrict("foo")).toBe(false);
            expect(g.containsStrict(null)).toBe(false);
            expect(g.containsStrict("")).toBe(true);
        });

        it("uses strict comparison in array", () => {
            const collection = new Collection([1, 2, 3]);
            expect(collection.containsStrict(2)).toBe(true);
            expect(collection.containsStrict("2")).toBe(false);
        });

        it("counts a callback match holding null, as array_any does", () => {
            // CollectionTest::testContainsStrict
            // docs/php-parity/task-31-laravel-13-33-sync.json, "containsStrict-list-null-callback",
            // "containsStrict-list-zero-callback" and "containsStrict-null-first-callback"
            const c = collect([1, null, 2]);
            expect(c.containsStrict((value) => value === null)).toBe(true);
            expect(c.containsStrict((value) => value === 0)).toBe(false);
            expect(collect([null, "a"]).containsStrict(() => true)).toBe(true);
            // docs/php-parity/task-30-map-order.json, "containsStrict-out-of-order-null-first-callback"
            expect(
                new Collection(
                    new Map([
                        [2, null],
                        [0, "a"],
                    ]),
                ).containsStrict(() => true),
            ).toBe(true);
        });

        it("walks a Map-built collection in its insertion order", () => {
            const seen: number[] = [];

            new Collection(
                new Map([
                    [2, "c"],
                    [0, "a"],
                    [1, "b"],
                ]),
            ).containsStrict((_value, key) => {
                seen.push(key);

                return false;
            });

            // docs/php-parity/task-31-laravel-13-33-sync.json, "containsStrict-out-of-order-callback-keys"
            expect(seen).toEqual([2, 0, 1]);
        });

        it("uses strict comparison in object", () => {
            const collection = new Collection({
                a: 1,
                b: 2,
                c: 3,
            });
            expect(collection.containsStrict(2)).toBe(true);
            expect(collection.containsStrict("2")).toBe(false);
        });

        it("compares an array or object item by value, the way PHP's === does", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "D4 containsStrict array by value"
            expect(new Collection({ a: [1] }).containsStrict([1])).toBe(true);
            expect(
                new Collection({ a: { x: 1 } }).containsStrict({ x: 1 }),
            ).toBe(true);
        });

        it("compares the two-argument form by value, an explicit null included", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "containsStrict-two-args-by-value"
            expect(
                collect([{ tags: ["a", "b"] }]).containsStrict("tags", [
                    "a",
                    "b",
                ]),
            ).toBe(true);
            expect(
                collect([{ t: { x: 1, y: 2 } }]).containsStrict("t", {
                    y: 2,
                    x: 1,
                }),
            ).toBe(false);
            expect(
                collect([{ name: null }, { name: "x" }]).containsStrict(
                    "name",
                    null,
                ),
            ).toBe(true);
            expect(collect([{ a: 1 }]).containsStrict("name", null)).toBe(true);
            expect(collect([{ name: "x" }]).containsStrict("name", null)).toBe(
                false,
            );
            expect(
                collect([{ tags: ["a", "b"] }]).doesntContainStrict("tags", [
                    "a",
                    "b",
                ]),
            ).toBe(false);
        });

        it("misses an object with the same entries in another order, on either backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "containsStrict-key-order"
            expect(
                new Collection({ a: { x: 1, y: 2 } }).containsStrict({
                    y: 2,
                    x: 1,
                }),
            ).toBe(false);
            expect(
                new Collection([{ x: 1, y: 2 }]).containsStrict({ y: 2, x: 1 }),
            ).toBe(false);
        });

        it("reads an explicit undefined second argument as PHP's null", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-two-args-null-value-others"
            expect([
                collect([{ a: null }, { a: 1 }]).containsStrict("a", null),
                collect([{ a: 1 }]).containsStrict("a", null),
            ]).toEqual([true, false]);

            // JS-only: an explicit undefined stands for PHP's null, so it counts as a second argument
            expect([
                collect([{ a: null }, { a: 1 }]).containsStrict("a", undefined),
                collect([{ a: 1 }]).containsStrict("a", undefined),
            ]).toEqual([true, false]);
        });
    });

    describe("doesntContain", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testDoesntContain
            const c = collect([1, 3, 5]);

            expect(c.doesntContain(1)).toBe(false);
            expect(c.doesntContain("1")).toBe(false);
            expect(c.doesntContain(2)).toBe(true);
            expect(c.doesntContain("2")).toBe(true);

            const d = collect(["1"]);

            expect(d.doesntContain("1")).toBe(false);
            expect(d.doesntContain(1)).toBe(false);

            const e = collect([null]);

            expect(e.doesntContain(false)).toBe(false);
            expect(e.doesntContain(null)).toBe(false);
            expect(e.doesntContain([])).toBe(false);
            expect(e.doesntContain(0)).toBe(false);
            expect(e.doesntContain("")).toBe(false);

            const f = collect([0]);

            expect(f.doesntContain(0)).toBe(false);
            expect(f.doesntContain("0")).toBe(false);
            expect(f.doesntContain(false)).toBe(false);
            expect(f.doesntContain(null)).toBe(false);
            expect(f.doesntContain((item) => item < 5)).toBe(false);
            expect(f.doesntContain((item) => item > 5)).toBe(true);

            const g = collect([{ v: 1 }, { v: 3 }, { v: 5 }]);

            expect(g.doesntContain("v", 1)).toBe(false);
            expect(g.doesntContain("v", 2)).toBe(true);

            const h = collect(["date", "class", { foo: 50 }]);

            expect(h.doesntContain("date")).toBe(false);
            expect(h.doesntContain("class")).toBe(false);
            expect(h.doesntContain("foo")).toBe(true);

            const i = collect([
                { a: false, b: false },
                { a: true, b: false },
            ]);

            expect(i.doesntContain((item) => item.a === true)).toBe(false);
            expect(i.doesntContain((item) => item.b === true)).toBe(true);

            const j = collect([null, 1, 2]);

            expect(j.doesntContain((item) => item === null)).toBe(false);
        });

        it("reads an explicit undefined second argument as PHP's null", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-two-args-null-value-others"
            expect([
                collect([{ a: null }, { a: 1 }]).doesntContain("a", null),
                collect([{ a: 1 }]).doesntContain("a", null),
            ]).toEqual([false, true]);

            // JS-only: an explicit undefined stands for PHP's null, so it counts as a second argument
            expect([
                collect([{ a: null }, { a: 1 }]).doesntContain("a", undefined),
                collect([{ a: 1 }]).doesntContain("a", undefined),
            ]).toEqual([false, true]);
        });
    });

    describe("doesntContainStrict", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testDoesntContainStrict
            const c = collect([1, 3, 5, "02"]);
            expect(c.doesntContainStrict(1)).toBe(false);
            expect(c.doesntContainStrict("1")).toBe(true);
            expect(c.doesntContainStrict(2)).toBe(true);
            expect(c.doesntContainStrict("2")).toBe(true);
            expect(c.doesntContainStrict("02")).toBe(false);
            expect(c.doesntContainStrict(true)).toBe(true);
            // @ts-expect-error - operator < on string | number union
            expect(c.doesntContainStrict((item) => item < 5)).toBe(false);
            // @ts-expect-error - operator > on string | number union
            expect(c.doesntContainStrict((item) => item > 5)).toBe(true);

            const d = collect([0]);
            expect(d.doesntContainStrict(0)).toBe(false);
            expect(d.doesntContainStrict("0")).toBe(true);
            expect(d.doesntContainStrict(false)).toBe(true);
            expect(d.doesntContainStrict(null)).toBe(true);

            const e = collect([1, null]);
            expect(e.doesntContainStrict(null)).toBe(false);
            expect(e.doesntContainStrict(0)).toBe(true);
            expect(e.doesntContainStrict(false)).toBe(true);

            const f = collect([{ v: 1 }, { v: 3 }, { v: "04" }, { v: 5 }]);
            expect(f.doesntContainStrict("v", 1)).toBe(false);
            expect(f.doesntContainStrict("v", 2)).toBe(true);
            expect(f.doesntContainStrict("v", "1")).toBe(true);
            expect(f.doesntContainStrict("v", 4)).toBe(true);
            expect(f.doesntContainStrict("v", "04")).toBe(false);
            expect(f.doesntContainStrict("v", "4")).toBe(true);

            const g = collect(["date", "class", { foo: 50 }, ""]);
            expect(g.doesntContainStrict("date")).toBe(false);
            expect(g.doesntContainStrict("class")).toBe(false);
            expect(g.doesntContainStrict("foo")).toBe(true);
            expect(g.doesntContainStrict(null)).toBe(true);
            expect(g.doesntContainStrict("")).toBe(false);
        });

        it("negates a callback match holding null", () => {
            // docs/php-parity/task-31-laravel-13-33-sync.json, "doesntContainStrict-list-null-callback"
            expect(
                collect([1, null, 2]).doesntContainStrict(
                    (value) => value === null,
                ),
            ).toBe(false);
        });

        it("reads an explicit undefined second argument as PHP's null", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-two-args-null-value-others"
            expect([
                collect([{ a: null }, { a: 1 }]).doesntContainStrict("a", null),
                collect([{ a: 1 }]).doesntContainStrict("a", null),
            ]).toEqual([false, true]);

            // JS-only: an explicit undefined stands for PHP's null, so it counts as a second argument
            expect([
                collect([{ a: null }, { a: 1 }]).doesntContainStrict(
                    "a",
                    undefined,
                ),
                collect([{ a: 1 }]).doesntContainStrict("a", undefined),
            ]).toEqual([false, true]);
        });
    });

    describe("crossJoin", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testCrossJoin
            expect(collect([1, 2]).crossJoin(["a", "b"]).all()).toEqual([
                [1, "a"],
                [1, "b"],
                [2, "a"],
                [2, "b"],
            ]);

            expect(
                collect([1, 2])
                    .crossJoin(collect(["a", "b"]))
                    .all(),
            ).toEqual([
                [1, "a"],
                [1, "b"],
                [2, "a"],
                [2, "b"],
            ]);

            expect(
                collect([1, 2])
                    .crossJoin(collect(["a", "b"]), collect(["I", "II"]))
                    .all(),
            ).toEqual([
                [1, "a", "I"],
                [1, "a", "II"],
                [1, "b", "I"],
                [1, "b", "II"],
                [2, "a", "I"],
                [2, "a", "II"],
                [2, "b", "I"],
                [2, "b", "II"],
            ]);
        });

        it("walks a keyed operand's values on a list backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collection-crossJoin-list-keyed-operand"
            const rows = collect([1, 2]).crossJoin({ k: "a", j: "b" }).all();
            expect(rows).toEqual([
                [1, "a"],
                [1, "b"],
                [2, "a"],
                [2, "b"],
            ]);
        });

        it("treats an object backing's values as one dimension, like a list's", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collection-crossJoin-assoc-items"
            expect(
                collect({ size: ["S", "M"] })
                    .crossJoin({ color: ["red", "blue"] })
                    .all(),
            ).toEqual([
                [
                    ["S", "M"],
                    ["red", "blue"],
                ],
            ]);
            expect(collect({ a: 1, b: 2 }).crossJoin(["x", "y"]).all()).toEqual(
                [
                    [1, "x"],
                    [1, "y"],
                    [2, "x"],
                    [2, "y"],
                ],
            );
            expect(
                collect({ a: [1, 2] })
                    .crossJoin({ b: ["x"] }, { c: ["I", "II"] })
                    .all(),
            ).toEqual([[[1, 2], ["x"], ["I", "II"]]]);
            expect(
                collect({ a: 1, b: 2 }).crossJoin({ c: 3, d: 4 }).all(),
            ).toEqual([
                [1, 3],
                [1, 4],
                [2, 3],
                [2, 4],
            ]);
        });

        it("crosses nothing with a null operand, and a scalar one as a single value", () => {
            const collection = collect([1, 2]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-crossJoin-null-and-scalar-operands"
            expect(collection.crossJoin(null).all()).toEqual([]);
            // A scalar is outside crossJoin()'s operand types; PHP's runtime casts it to an array holding it
            expect(
                Reflect.apply(collection.crossJoin, collection, ["x"]).all(),
            ).toEqual([
                [1, "x"],
                [2, "x"],
            ]);
        });

        it.fails(
            "walks a Map-built receiver in the order it holds its keys",
            () => {
                // Ordered-backing gap: PHP walks the receiver in insertion order, key 2 first
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-receiver-out-of-order"
                expect(outOfOrderKeys().crossJoin(["x"]).all()).toEqual([
                    ["c", "x"],
                    ["a", "x"],
                    ["b", "x"],
                ]);
            },
        );

        it.fails(
            "walks a Map-built operand in the order it holds its keys",
            () => {
                const operand = collect(
                    new Map([
                        [2, "c"],
                        [0, "a"],
                    ]),
                );

                // Ordered-backing gap: PHP walks the operand in insertion order, key 2 first
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-operand-out-of-order"
                expect(collect([1]).crossJoin(operand).all()).toEqual([
                    [1, "c"],
                    [1, "a"],
                ]);
            },
        );
    });

    describe("diff", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testDiffCollection
            const c = collect({ id: 1, first_word: "Hello" });
            expect(
                c
                    .diff(collect({ first_word: "Hello", last_word: "World" }))
                    .all(),
            ).toEqual({ id: 1 });

            // CollectionTest::testDiffUsingWithCollection
            const d = collect(["en_GB", "fr", "HR"]);
            expect(
                d
                    .diff(collect(["en_gb", "hr"]))
                    .values()
                    .toArray(),
            ).toEqual(["en_GB", "fr", "HR"]);

            // CollectionTest::testDiffNull
            const e = collect({ id: 1, first_word: "Hello" });
            expect(e.diff(null).all()).toEqual({ id: 1, first_word: "Hello" });
        });

        it("diffs on values only, ignoring which key held the value on other", () => {
            // Pinned so `diff` cannot regress into array_diff_assoc: neither left key
            // exists on the right, so an assoc-style diff would keep both, while a
            // value-only diff drops "first_word" because "Hello" is among the values.
            const c = collect({ id: 1, first_word: "Hello" });
            expect(c.diff({ x: "Hello" }).all()).toEqual({ id: 1 });
        });

        it("returns items not in given array collection", () => {
            const collection = collect([1, 2, 3, 4]);
            const diff = collection.diff([2, 4]);
            expect(diff.all()).toEqual([1, 3]);
        });

        it("returns items not in given object collection", () => {
            const collection = collect({ a: 1, b: 2, c: 3, d: 4 });
            const diff = collection.diff({ b: 2, d: 4 });
            expect(diff.all()).toEqual({ a: 1, c: 3 });
        });

        it("diffs across a mismatched operand shape by value", () => {
            // PHP-verified via docs/php-parity/task-06-setops.json ("diff and
            // intersect accept any array operand"): collect(['a'=>10,'b'=>20])
            // ->diff([20]) === ['a'=>10].
            expect(new Collection({ a: 10, b: 20 }).diff([20]).all()).toEqual({
                a: 10,
            });
        });

        it.fails(
            "keeps a Map-built receiver's order for the items it keeps",
            () => {
                const result = outOfOrderKeys().diff(["a"]);

                // Ordered-backing gap: PHP keeps the items in the receiver's insertion order, key 2 before 1
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-receiver-out-of-order"
                expect([result.keys().all(), result.values().all()]).toEqual([
                    [2, 1],
                    ["c", "b"],
                ]);
            },
        );

        it("reads a plain object's all member as one of its values, never unwrapping it", () => {
            const operand = { all: () => ["b"] };
            const result = collect(["a", "b"]).diff(operand);

            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-F-plain-object-all-member-is-data-by-value": PHP's all member casts to 'zzz', since array_diff
            // cannot cast a Closure, and a function matches by identity here, so neither matches an item
            expect(result.all()).toEqual(["a", "b"]);
        });
    });

    describe("diffUsing", () => {
        it("Laravel Tests", () => {
            const d = collect(["en_GB", "fr", "HR"]);

            // CollectionTest::testDiffUsingWithCollection
            expect(
                d
                    .diffUsing(collect(["en_gb", "hr"]), strcasecmp)
                    .values()
                    .toArray(),
            ).toEqual(["fr"]);

            // CollectionTest::testDiffUsingWithNull
            expect(d.diffUsing(null, strcasecmp).values().toArray()).toEqual([
                "en_GB",
                "fr",
                "HR",
            ]);
        });

        it("renumbers a list's survivors", () => {
            const diffed = collect(["a", "b", "c"]).diffUsing(
                ["a"],
                strcasecmp,
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-diffUsing-list-keeps-keys"
            // PHP keeps the gap ({1: "b", 2: "c"}); a list backing reindexes, as a JS array holds no sparse keys.
            expect(diffed.all()).toEqual(["b", "c"]);
            expect(diffed.keys().all()).toEqual([0, 1]);
            expect(diffed.values().all()).toEqual(["b", "c"]);
        });

        it("reads a comparator's 0 as equal, as PHP's <=> answers", () => {
            const diffed = collect([1, 2, 3]).diffUsing([2], (a, b) =>
                Math.sign(a - b),
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-diffUsing-spaceship-comparator"
            // PHP keeps the gap ({0: 1, 2: 3}); a list backing reindexes, as a JS array holds no sparse keys.
            expect(diffed.all()).toEqual([1, 3]);
            expect(diffed.keys().all()).toEqual([0, 1]);
            expect(diffed.values().all()).toEqual([1, 3]);
        });

        it("drops a fraction from a comparator's answer, as PHP's int cast does", () => {
            const diffed = (answer: number) =>
                collect([1, 2, 3])
                    .diffUsing([2], () => answer)
                    .all();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-using-fractional-comparator"
            expect(diffed(0.5)).toEqual([]);
            expect(diffed(-0.99)).toEqual([]);
            expect(diffed(1.5)).toEqual([1, 2, 3]);
        });

        it("reads a NAN or infinite comparator answer as equal, as PHP's int cast makes it 0", () => {
            const diffed = (answer: number) =>
                collect([1, 2, 3])
                    .diffUsing([2], () => answer)
                    .all();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-using-non-finite-comparator"
            expect(diffed(NaN)).toEqual([]);
            expect(diffed(Infinity)).toEqual([]);
            expect(diffed(-Infinity)).toEqual([]);
        });

        it("casts a comparator answer past PHP's int range to its low 64 bits, so 2**64 means equal", () => {
            const byTimes = (times: number) => (a: number, b: number) =>
                Math.sign(a - b) * times;

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-using-comparator-past-int-range"
            expect(
                collect([1, 2, 3])
                    .diffUsing([2], byTimes(2 ** 64))
                    .values()
                    .all(),
            ).toEqual([]);
            expect(
                collect([1, 2, 3])
                    .intersectUsing([2], byTimes(2 ** 64))
                    .values()
                    .all(),
            ).toEqual([1, 2, 3]);
            expect(
                collect([1, 2, 3]).diffUsing([2], byTimes(1e19)).values().all(),
            ).toEqual([1, 3]);
        });

        it("keeps a record's keys", () => {
            const diffed = collect({
                a: "green",
                b: "brown",
                c: "blue",
            }).diffUsing({ A: "GREEN", 0: "yellow" }, strcasecmp);

            // docs/php-parity/task-24-data-release-readiness.json, "d6-diff-using"
            expect(diffed.all()).toEqual({ b: "brown", c: "blue" });
            expect(diffed.keys().all()).toEqual(["b", "c"]);
            expect(diffed.values().all()).toEqual(["brown", "blue"]);
        });

        it.fails(
            "keeps a Map-built receiver's order for the items it keeps",
            () => {
                const result = outOfOrderKeys().diffUsing(["A"], strcasecmp);

                // Ordered-backing gap: PHP keeps the items in the receiver's insertion order, key 2 before 1
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-receiver-out-of-order"
                expect([result.keys().all(), result.values().all()]).toEqual([
                    [2, 1],
                    ["c", "b"],
                ]);
            },
        );
    });

    describe("diffAssoc", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testDiffAssoc
            const c1 = collect({
                id: 1,
                first_word: "Hello",
                not_affected: "value",
            });
            const c2 = collect({
                id: 123,
                foo_bar: "Hello",
                not_affected: "value",
            });

            // Only not_affected holds the same key and the same value on both sides.
            expect(c1.diffAssoc(c2).all()).toEqual({
                id: 1,
                first_word: "Hello",
            });

            // CollectionTest::testDiffAssocUsing
            const c3 = collect({ a: "green", b: "brown", c: "blue", 0: "red" });
            const c4 = collect({ A: "green", 0: "yellow", 1: "red" });

            // Keys match case-sensitively, so only index 0 pairs up, and its values differ.
            expect(c3.diffAssoc(c4).all()).toEqual({
                a: "green",
                b: "brown",
                c: "blue",
                0: "red",
            });

            // strcasecmp pairs a with A, whose values match, and 0 with 0, whose values differ.
            expect(c3.diffAssocUsing(c4, strcasecmp).all()).toEqual({
                b: "brown",
                c: "blue",
                0: "red",
            });
        });

        it("returns a reindexed list for an array-backed collection", () => {
            // `diffAssoc` delegates to `dataDiffAssoc`, whose array branch
            // pushes survivors into a fresh array, reindexing them.
            expect(collect([1, 2, 3]).diffAssoc([1, 9, 3]).all()).toEqual([2]);
        });

        it("matches an object-backed operand by key on a list backing, never by position", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "diffAssoc-list-keyed-operand"
            expect(
                collect([1, 2])
                    .diffAssoc(collect({ a: 1, b: 2 }))
                    .all(),
            ).toEqual([1, 2]);
        });

        // docs/php-parity/task-17-second-review.json, "array_diff_assoc casts values to string"
        it("matches values by PHP's string cast", () => {
            expect(
                new Collection({ a: 0 }).diffAssoc({ a: "0" } as never).all(),
            ).toEqual({});
        });

        it("reads a Collection operand's items when matching keys and values", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "diffAssoc-collection-matching-key"
            const result = collect({ id: 1, name: "a" }).diffAssoc(
                collect({ id: 1, name: "b" }),
            );

            expect(result.all()).toEqual({ name: "a" });
            expect(result.keys().all()).toEqual(["name"]);
            expect(result.values().all()).toEqual(["a"]);
        });

        it("reads a Collection operand's items for diffAssocUsing", () => {
            const diffed = collect({
                a: "green",
                b: "brown",
                c: "blue",
                0: "red",
            }).diffAssocUsing(
                collect({ A: "green", 0: "yellow", 1: "red" }),
                strcasecmp,
            );

            // CollectionTest::testDiffAssocUsing
            // docs/php-parity/task-23-obj-release-readiness.json, "C8 diffAssocUsing strcasecmp"
            expect(diffed.all()).toEqual({ b: "brown", c: "blue", 0: "red" });
            // A plain object literal holds key 0 first, so the answer does too; a Map keeps PHP's order (below)
            expect(diffed.keys().all()).toEqual([0, "b", "c"]);
            expect(diffed.values().all()).toEqual(["red", "brown", "blue"]);
        });

        it.fails(
            "keeps a Map-built receiver's order for the items diffAssocUsing keeps",
            () => {
                const diffed = collect(
                    new Map<string | number, string>([
                        ["a", "green"],
                        ["b", "brown"],
                        ["c", "blue"],
                        [0, "red"],
                    ]),
                ).diffAssocUsing(
                    collect(
                        new Map<string | number, string>([
                            ["A", "green"],
                            [0, "yellow"],
                            [1, "red"],
                        ]),
                    ),
                    strcasecmp,
                );

                // Ordered-backing gap: PHP keeps the receiver's insertion order, so key 0 comes after b and c
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-diffAssocUsing-mixed-keys-order"
                expect([diffed.keys().all(), diffed.values().all()]).toEqual([
                    ["b", "c", 0],
                    ["brown", "blue", "red"],
                ]);
            },
        );

        it("reads a Collection operand's items for diffAssocUsing on a list backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "diffAssocUsing-list-collection-operand"
            expect(
                collect([1, 2, 3])
                    .diffAssocUsing(collect([1, 9, 3]), strcasecmp)
                    .all(),
            ).toEqual([2]);
        });

        it("reads a null operand as no items, for diffAssocUsing too", () => {
            const results = [
                collect({ a: 1 }).diffAssoc(null),
                collect({ a: 1 }).diffAssocUsing(null, strcasecmp),
            ];

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-assoc-and-key-diffs-null-operand"
            for (const result of results) {
                expect(result.all()).toEqual({ a: 1 });
                expect(result.keys().all()).toEqual(["a"]);
                expect(result.values().all()).toEqual([1]);
            }
        });

        it("reads a plain object's all member as one of its entries, never unwrapping it", () => {
            const result = collect({ a: 1, b: 2 }).diffAssoc({
                all: () => ({ b: 2 }),
            });

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-plain-object-all-member-is-data-by-key"
            expect(result.all()).toEqual({ a: 1, b: 2 });
            expect(result.keys().all()).toEqual(["a", "b"]);
            expect(result.values().all()).toEqual([1, 2]);
        });

        it("reads a plain object's all member as one of its entries for diffAssocUsing, never unwrapping it", () => {
            const result = collect({ a: 1, b: 2 }).diffAssocUsing(
                { all: () => ({ b: 2 }) },
                strcasecmp,
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-plain-object-all-member-is-data-by-key"
            expect(result.all()).toEqual({ a: 1, b: 2 });
            expect(result.keys().all()).toEqual(["a", "b"]);
            expect(result.values().all()).toEqual([1, 2]);
        });

        it.fails(
            "keeps a Map-built receiver's order for the items it keeps",
            () => {
                const result = outOfOrderKeys().diffAssoc({ 0: "a" });

                // Ordered-backing gap: PHP keeps the items in the receiver's insertion order, key 2 before 1
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-receiver-out-of-order"
                expect([result.keys().all(), result.values().all()]).toEqual([
                    [2, 1],
                    ["c", "b"],
                ]);
            },
        );
    });

    describe("diffKeys", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testDiffKeys
            const c1 = collect({ id: 1, first_word: "Hello" });
            const c2 = collect({ id: 123, foo_bar: "Hello" });
            expect(c1.diffKeys(c2).all()).toEqual({ first_word: "Hello" });

            // CollectionTest::testDiffKeysUsing
            const d1 = collect({ id: 1, first_word: "Hello" });
            const d2 = collect({ ID: 123, foo_bar: "Hello" });
            expect(d1.diffKeys(d2).all()).toEqual({
                id: 1,
                first_word: "Hello",
            });
        });

        it("signature examples", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-diffKeys-signature-examples"
            // PHP keeps the list's keys 3 and 4; a list backing reindexes, as a JS array holds no sparse keys.
            expect(
                new Collection({ a: 1, b: 2, c: 3 }).diffKeys({ b: 2 }).all(),
            ).toEqual({ a: 1, c: 3 });
            expect(
                new Collection([1, 3, 5, 7, 8]).diffKeys([1, 3, 5]).all(),
            ).toEqual([7, 8]);
            expect(
                new Collection([1, 3, 5]).diffKeys([1, 3, 5, 7, 8]).all(),
            ).toEqual([]);
        });

        it("counts a list operand's indexes as its keys, never its length", () => {
            const diffed = collect({ length: 5, b: 2 }).diffKeys(["x"]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-diffKeys-length-key"
            expect(diffed.all()).toEqual({ length: 5, b: 2 });
            expect(diffed.keys().all()).toEqual(["length", "b"]);
            expect(diffed.values().all()).toEqual([5, 2]);
        });

        it("reads a null operand as no items", () => {
            const diffed = collect({ a: 1 }).diffKeys(null);

            // docs/php-parity/task-24-data-release-readiness.json, "d6-diff-keys"
            expect(diffed.all()).toEqual({ a: 1 });
            expect(diffed.keys().all()).toEqual(["a"]);
            expect(diffed.values().all()).toEqual([1]);
        });

        it("reads a plain object's all member as one of its keys, never unwrapping it", () => {
            const result = collect({ all: 1, b: 2 }).diffKeys({
                all: () => ({ b: 2 }),
            });

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-plain-object-all-member-is-data"
            expect(result.all()).toEqual({ b: 2 });
            expect(result.keys().all()).toEqual(["b"]);
            expect(result.values().all()).toEqual([2]);
        });

        it.fails(
            "keeps a Map-built receiver's order for the items it keeps",
            () => {
                const result = outOfOrderKeys().diffKeys({ 0: "x" });

                // Ordered-backing gap: PHP keeps the items in the receiver's insertion order, key 2 before 1
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-receiver-out-of-order"
                expect([result.keys().all(), result.values().all()]).toEqual([
                    [2, 1],
                    ["c", "b"],
                ]);
            },
        );
    });

    describe("diffKeysUsing", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testDiffKeysUsing
            const c1 = collect({ id: 1, first_word: "Hello" });
            const c2 = { ID: 123, foo_bar: "Hello" } as Record<string, unknown>;

            expect(c1.diffKeysUsing(c2, strcasecmp).all()).toEqual({
                first_word: "Hello",
            });
        });

        it("reads a Collection operand's items", () => {
            // CollectionTest::testDiffKeysUsing
            // docs/php-parity/task-23-obj-release-readiness.json, "C22 diffKeysUsing"
            const result = collect({
                id: 1,
                first_word: "Hello",
            }).diffKeysUsing(
                collect({ ID: 123, foo_bar: "Hello" }),
                strcasecmp,
            );

            expect(result.all()).toEqual({ first_word: "Hello" });
            expect(result.keys().all()).toEqual(["first_word"]);
            expect(result.values().all()).toEqual(["Hello"]);
        });

        it("reads a Collection operand's items on a list backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "diffKeysUsing-list-collection-operand"
            expect(
                collect([1, 2, 3])
                    .diffKeysUsing(collect([9, 9]), strcasecmp)
                    .all(),
            ).toEqual([3]);
        });

        it("reads a null operand as no items", () => {
            const diffed = collect({ a: 1 }).diffKeysUsing(null, strcasecmp);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-assoc-and-key-diffs-null-operand"
            expect(diffed.all()).toEqual({ a: 1 });
            expect(diffed.keys().all()).toEqual(["a"]);
            expect(diffed.values().all()).toEqual([1]);
        });

        it("reads a plain object's all member as one of its entries, never unwrapping it", () => {
            const result = collect({ a: 1, b: 2 }).diffKeysUsing(
                { all: () => ({ b: 2 }) },
                strcasecmp,
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-plain-object-all-member-is-data-by-key"
            expect(result.all()).toEqual({ a: 1, b: 2 });
            expect(result.keys().all()).toEqual(["a", "b"]);
            expect(result.values().all()).toEqual([1, 2]);
        });

        it.fails(
            "keeps a Map-built receiver's order for the items it keeps",
            () => {
                const result = outOfOrderKeys().diffKeysUsing(
                    { 0: "x" },
                    strcasecmp,
                );

                // Ordered-backing gap: PHP keeps the items in the receiver's insertion order, key 2 before 1
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-receiver-out-of-order"
                expect([result.keys().all(), result.values().all()]).toEqual([
                    [2, 1],
                    ["c", "b"],
                ]);
            },
        );
    });

    describe("duplicates", () => {
        describe("Laravel Tests", () => {
            it("test duplicates", () => {
                // CollectionTest::testDuplicates
                // A list's duplicates keep their positions, which are the answer, so this removal does not renumber
                // Laravel: [2 => 1, 5 => 'laravel', 7 => null]
                const c = collect([
                    1,
                    2,
                    1,
                    "laravel",
                    null,
                    "laravel",
                    "php",
                    null,
                ])
                    .duplicates()
                    .all();
                expect(c).toEqual({ 2: 1, 5: "laravel", 7: null });

                // does loose comparison
                // Laravel: [1 => '2', 3 => null]
                const d = collect([2, "2", [], null]).duplicates().all();
                expect(d).toEqual({ 1: "2", 3: null });

                // works with mix of primitives
                // Laravel: [3 => ['laravel'], 5 => '2']
                const e = collect([1, "2", ["laravel"], ["laravel"], null, "2"])
                    .duplicates()
                    .all();
                expect(e).toEqual({ 3: ["laravel"], 5: "2" });

                // works with mix of objects and primitives **excepts numbers**.
                // Laravel: [1 => $expected, 2 => $expected, 5 => '2']
                const expected = collect(["laravel"]);
                const duplicates = collect([
                    collect(["laravel"]),
                    expected,
                    expected,
                    [],
                    "2",
                    "2",
                ])
                    .duplicates()
                    .all();
                expect(duplicates).toEqual({
                    1: expected,
                    2: expected,
                    5: "2",
                });
            });

            it("test duplicates with keys", () => {
                // CollectionTest::testDuplicatesWithKey
                // A list's duplicates keep their positions, which are the answer, so this removal does not renumber
                // Laravel answers each duplicate's value at the key, not the item: [2 => 'laravel']
                const items = [
                    { framework: "vue" },
                    { framework: "laravel" },
                    { framework: "laravel" },
                ];
                const c = collect(items).duplicates("framework").all();
                expect(c).toEqual({ 2: "laravel" });

                // works with key and strict
                // Laravel: [2 => 'vue']
                const items2 = [
                    { Framework: "vue" },
                    { framework: "vue" },
                    { Framework: "vue" },
                ];
                const d = collect(items2).duplicates("Framework", true).all();
                expect(d).toEqual({ 2: "vue" });
            });

            it("test duplicates with callback", () => {
                // CollectionTest::testDuplicatesWithCallback
                // A list's duplicates keep their positions, which are the answer, so this removal does not renumber
                // Laravel answers each duplicate's callback result, not the item: [2 => 'laravel']
                const items = [
                    { framework: "vue" },
                    { framework: "laravel" },
                    { framework: "laravel" },
                ];
                const c = collect(items)
                    .duplicates((item) => item.framework)
                    .all();
                expect(c).toEqual({ 2: "laravel" });
            });
        });

        it("keeps each duplicate's own key, a list's position or a record's name", () => {
            const keyed = collect({ a: 1, b: 2, c: 1 }).duplicates();
            const list = collect(["x", "y", "x"]).duplicates();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-duplicates-keyed"
            expect([keyed.keys().all(), keyed.values().all()]).toEqual([
                ["c"],
                [1],
            ]);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-duplicates-list-first-key"
            expect([list.keys().all(), list.values().all()]).toEqual([
                [2],
                ["x"],
            ]);
        });

        it("hands a callback each value and key", () => {
            const duplicates = collect({ a: 1, b: 2 }).duplicates(
                (value, key) => (key === "b" ? 1 : value),
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-duplicates-callback-key-arg"
            expect(duplicates.all()).toEqual({ b: 1 });
            expect([
                duplicates.keys().all(),
                duplicates.values().all(),
            ]).toEqual([["b"], [1]]);
        });

        it("compares loosely, as array_unique's SORT_REGULAR sort does", () => {
            const duplicates = collect(["a", 0, "b", "0", "a"]).duplicates();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-duplicates-loose-sort-regular"
            expect([
                duplicates.keys().all(),
                duplicates.values().all(),
            ]).toEqual([
                [3, 4],
                ["0", "a"],
            ]);
        });

        it("appends past the highest position a list's duplicates keep", () => {
            const pushed = collect(["x", "y", "x"]).duplicates().push("z");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-duplicates-list-then-push"
            expect([pushed.keys().all(), pushed.values().all()]).toEqual([
                [2, 3],
                ["x", "z"],
            ]);
        });

        it("walks mixed types once, keeping the first of each loosely equal run", () => {
            const duplicates = collect(["abc", "0", false, ""]).duplicates();

            // JS-only: PHP's == is not transitive; array_unique's sorted walk keeps only 'abc' and '0', so PHP also
            // counts false a duplicate
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-duplicates-non-transitive-loose"
            expect([
                duplicates.keys().all(),
                duplicates.values().all(),
            ]).toEqual([[3], [""]]);
        });

        it.fails("walks a Map-built collection in its insertion order", () => {
            const duplicates = collect(
                new Map([
                    [2, "a"],
                    [0, "b"],
                    [1, "a"],
                ]),
            ).duplicates();

            // Ordered-backing gap: PHP walks key 2 first, so the a under key 1 is the duplicate
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-duplicates-out-of-order"
            expect([
                duplicates.keys().all(),
                duplicates.values().all(),
            ]).toEqual([[1], ["a"]]);
        });
    });

    describe("duplicatesStrict", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testDuplicatesWithStrict
            // A list's duplicates keep their positions, which are the answer, so this removal does not renumber
            // Laravel: [2 => 1, 5 => 'laravel', 7 => null]
            const c = collect([
                1,
                2,
                1,
                "laravel",
                null,
                "laravel",
                "php",
                null,
            ])
                .duplicatesStrict()
                .all();
            expect(c).toEqual({ 2: 1, 5: "laravel", 7: null });

            // does strict comparison
            // Laravel: []
            const d = collect([2, "2", [], null]).duplicatesStrict().all();
            expect(d).toEqual({});

            // works with mix of primitives
            // Laravel: [3 => ['laravel'], 5 => '2']
            const e = collect([1, "2", ["laravel"], ["laravel"], null, "2"])
                .duplicatesStrict()
                .all();
            expect(e).toEqual({ 3: ["laravel"], 5: "2" });

            // works with mix of primitives, objects, and numbers
            // Laravel: [2 => $expected, 5 => '2']
            const expected = collect(["laravel"]);
            const duplicates = collect([
                collect(["laravel"]),
                expected,
                expected,
                [],
                "2",
                "2",
            ])
                .duplicatesStrict()
                .all();
            expect(duplicates).toEqual({ 2: expected, 5: "2" });
        });

        it("tells apart objects with the same entries in another order", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "uniqueStrict-duplicatesStrict-key-order"
            expect(
                collect([
                    { x: 1, y: 2 },
                    { y: 2, x: 1 },
                ])
                    .duplicatesStrict()
                    .all(),
            ).toEqual({});
        });
    });

    describe("except", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testExcept
            const data = collect({
                first: "Taylor",
                last: "Otwell",
                email: "taylorotwell@gmail.com",
            });

            expect(data.except(null).all()).toEqual(data.all());
            expect(data.except(["last", "email", "missing"]).all()).toEqual({
                first: "Taylor",
            });
            expect(data.except("last", "email", "missing").all()).toEqual({
                first: "Taylor",
            });
            expect(
                data.except(collect(["last", "email", "missing"])).all(),
            ).toEqual({ first: "Taylor" });

            expect(data.except(["last"]).all()).toEqual({
                first: "Taylor",
                email: "taylorotwell@gmail.com",
            });
            expect(data.except("last").all()).toEqual({
                first: "Taylor",
                email: "taylorotwell@gmail.com",
            });
            expect(data.except(collect(["last"])).all()).toEqual({
                first: "Taylor",
                email: "taylorotwell@gmail.com",
            });

            // CollectionTest::testExceptSelf
            const data2 = collect({ first: "Taylor", last: "Otwell" });
            expect(data2.except(data2).all()).toEqual({
                first: "Taylor",
                last: "Otwell",
            });
        });

        describe("reads its keys as PHP's $keys argument", () => {
            const person = () =>
                collect({ first: "Taylor", last: "Otwell", email: "e" });

            it("ignores the arguments after an array of keys", () => {
                const except = person().except(["first"], "last");

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-except-array-then-extra-arg"
                expect(except.keys().all()).toEqual(["last", "email"]);
                expect(except.values().all()).toEqual(["Otwell", "e"]);
            });

            it("takes a keyed Collection's values as the keys", () => {
                const except = person().except(
                    collect({ x: "first", y: "email" }),
                );

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-except-keyed-collection-arg"
                expect(except.all()).toEqual({ last: "Otwell" });
                expect(except.keys().all()).toEqual(["last"]);
                expect(except.values().all()).toEqual(["Otwell"]);
            });

            it("keeps every item for an empty array of keys", () => {
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-except-empty-array"
                expect(person().except([]).all()).toEqual(person().all());
            });

            it("reads a null among the keys as the '' key, where a bare null keeps every item", () => {
                const blank = () => collect({ "": 1, a: 2 });
                const except = blank().except([null]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-except-forget-null-key"
                expect(blank().except(null).all()).toEqual({ "": 1, a: 2 });
                expect([except.keys().all(), except.values().all()]).toEqual([
                    ["a"],
                    [2],
                ]);
                expect(blank().except("a", null).all()).toEqual({});
                expect(
                    blank()
                        .except(collect([null]))
                        .all(),
                ).toEqual({ a: 2 });
                // JS-only: undefined stands for PHP's null.
                expect(blank().except([undefined]).all()).toEqual({ a: 2 });
            });

            it("throws array_key_exists()'s TypeError for a later array or collection key, even over no items", () => {
                const failure = new TypeError(
                    "array_key_exists(): Argument #1 ($key) must be a valid array offset type",
                );
                const pair = collect({ a: 1, b: 2 });

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-array-key-type-error"
                expect(() => pair.except("a", ["b"])).toThrow(failure);
                expect(() =>
                    pair.except("a", collect(["b"]) as unknown as string),
                ).toThrow(failure);
                expect(() =>
                    collect([]).except([["b"]] as unknown as string[]),
                ).toThrow(failure);
            });
        });

        it("removes a literal dotted key before reading it as a path", () => {
            const except = collect({ "a.b": 1, a: { b: 2 } }).except("a.b");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-except-dot-key-literal-first"
            expect(except.all()).toEqual({ a: { b: 2 } });
            expect([except.keys().all(), except.values().all()]).toEqual([
                ["a"],
                [{ b: 2 }],
            ]);
        });

        it("looks a float up by its string form, then removes its integer part, as unset casts it", () => {
            const except = collect({ "1.5": "a", 1: "b", c: "d" }).except([
                1.5,
            ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-except-float-key"
            expect([except.keys().all(), except.values().all()]).toEqual([
                ["1.5", "c"],
                ["a", "d"],
            ]);
            expect(collect({ "1.5": "a", c: "d" }).except([1.5]).all()).toEqual(
                {
                    "1.5": "a",
                    c: "d",
                },
            );
            expect(
                collect({ 1: { 5: "x", 6: "y" } })
                    .except([1.5])
                    .all(),
            ).toEqual({ 1: { 6: "y" } });
        });

        it("reads a numeric string as a list's index", () => {
            const except = collect(["a", "b", "c"]).except("1");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-except-list-numeric-string", whose
            // keys 0 and 2 name these items; a list renumbers them, as every removal from a list does
            expect(except.all()).toEqual(["a", "c"]);
            expect(except.keys().all()).toEqual([0, 1]);
        });
    });

    describe("filter", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testFilter
            const c = collect([
                { id: 1, name: "Hello" },
                { id: 2, name: "World" },
            ]);
            expect(c.filter((item) => item.id === 2).all()).toEqual([
                { id: 2, name: "World" },
            ]);

            const c2 = collect(["", "Hello", "", "World"]);
            expect(c2.filter().values().toArray()).toEqual(["Hello", "World"]);

            const c3 = collect({ id: 1, first: "Hello", second: "World" });
            expect(c3.filter((_item, key) => key !== "id").all()).toEqual({
                first: "Hello",
                second: "World",
            });

            const c4 = collect([1, 2, 3, null, false, "", 0, [], {}]);
            expect(c4.filter().all()).toEqual([1, 2, 3]);

            const c5 = collect({
                a: 1,
                b: 2,
                c: 3,
                d: null,
                e: false,
                f: "",
                g: 0,
                h: [],
                i: {},
            });
            expect(c5.filter().all()).toEqual({ a: 1, b: 2, c: 3 });
        });

        it("filters array with callback", () => {
            const collection = collect([1, 2, 3, 4]);
            const filtered = collection.filter((x) => x > 2);
            expect(filtered.all()).toEqual([3, 4]);
        });

        it("filters object with callback", () => {
            const collection = collect({ a: 1, b: 2, c: 3, d: 4 });
            const filtered = collection.filter((value) => value > 2);
            expect(filtered.all()).toEqual({ c: 3, d: 4 });
        });

        it("filters truthy array values when no callback", () => {
            const collection = collect([0, 1, false, 2, "", 3]);
            const filtered = collection.filter();
            expect(filtered.all()).toEqual([1, 2, 3]);
        });

        it("filters truthy object values when no callback", () => {
            const collection = collect({
                a: 0,
                b: 1,
                c: false,
                d: 2,
                e: "",
                f: 3,
            });
            const filtered = collection.filter();
            expect(filtered.all()).toEqual({ b: 1, d: 2, f: 3 });
        });

        // array_filter's falsy set is narrower than Boolean — PHP-verified
        // (docs/php-parity/task-04-shared.json, "Collection::filter() falsy set"): it
        // drops "0", "", 0, [], false, null, but keeps "00" and "0.0".
        it("drops PHP-falsy values including the string zero — both shapes agree", () => {
            expect(collect(["0", "", 0, "x"]).filter().all()).toEqual(["x"]);
            expect(
                collect({ a: "0", b: "", c: 0, d: "x" }).filter().all(),
            ).toEqual({ d: "x" });
        });

        it("keeps strings that merely look like zero — both shapes agree", () => {
            expect(collect(["00", "0.0", "0"]).filter().all()).toEqual([
                "00",
                "0.0",
            ]);
            expect(
                collect({ a: "00", b: "0.0", c: "0" }).filter().all(),
            ).toEqual({ a: "00", b: "0.0" });
        });

        it("hands an object backing's integer key to the callback as a number", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "F1 filter callback key type for int key"
            expect(
                new Collection({ 1: "a", x: "b" })
                    .filter((_value, key) => key === 1)
                    .all(),
            ).toEqual({ 1: "a" });
        });

        it("keeps every object without a callback, however empty", () => {
            // Class instances stand in for stdClass, ArrayObject and SplObjectStorage: a plain object, a
            // Map and a Set model PHP arrays here, which are falsy when empty.
            const kept = collect([
                new Date(0),
                new (class {})(),
                new (class {})(),
                new (class {})(),
                "x",
            ]).filter();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-filter-keeps-empty-objects"
            expect(kept.count()).toBe(5);
        });

        it('drops an item whose callback answers "0"', () => {
            const filtered = collect([1, 2]).filter((value) =>
                value > 1 ? "0" : "x",
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-filter-callback-string-zero"
            expect(filtered.all()).toEqual([1]);
            expect(filtered.keys().all()).toEqual([0]);
            expect(filtered.values().all()).toEqual([1]);
        });

        it.fails(
            "calls a callback in a Map-built collection's insertion order",
            () => {
                const seen: number[] = [];
                outOfOrderKeys().filter((_value, key) => {
                    seen.push(key);

                    return true;
                });

                // Ordered-backing gap: PHP calls the callback in insertion order, key 2 before 0 and 1
                // docs/php-parity/task-30-map-order.json, "filter-out-of-order-callback-order"
                expect(seen).toEqual([2, 0, 1]);
            },
        );

        it.fails(
            "keeps what a counting callback passes in a Map-built collection's insertion order",
            () => {
                let calls = 0;
                const kept = outOfOrderKeys().filter(() => ++calls <= 2);

                // Ordered-backing gap: PHP's first two calls see c under 2 and a under 0, and keep them in that order
                // docs/php-parity/task-30-map-order.json, "filter-out-of-order-first-two-visits"
                expect([kept.keys().all(), kept.values().all()]).toEqual([
                    [2, 0],
                    ["c", "a"],
                ]);
            },
        );
    });

    describe("first", () => {
        describe("Laravel Tests", () => {
            it("test first returns first item in collection", () => {
                // CollectionTest::testFirstReturnsFirstItemInCollection
                const c = collect(["foo", "bar"]);
                expect(c.first()).toBe("foo");
            });

            it("test first with callback", () => {
                // CollectionTest::testFirstWithCallback
                const c = collect(["foo", "bar", "baz"]);
                expect(
                    c.first((value) => {
                        return value === "bar";
                    }),
                ).toBe("bar");
            });

            it("test first with callback and default", () => {
                // CollectionTest::testFirstWithCallbackAndDefault
                const c = collect(["foo", "bar"]);
                expect(
                    c.first((value) => {
                        return value === "baz";
                    }, "default"),
                ).toBe("default");
            });

            it("test first with default and without callback", () => {
                // CollectionTest::testFirstWithDefaultAndWithoutCallback
                const c = collect();
                expect(c.first(null, "default")).toBe("default");

                const d = collect(["foo", "bar"]);
                expect(d.first(null, "default")).toBe("foo");
            });
        });

        it("returns first array item", () => {
            const collection = collect([1, 2, 3]);
            expect(collection.first()).toBe(1);
        });

        it("returns first object item", () => {
            const collection = collect({ a: 1, b: 2, c: 3 });
            expect(collection.first()).toBe(1);
        });

        it("returns first array item matching callback", () => {
            const collection = collect<number>([1, 2, 3, 4]);
            expect(collection.first((x) => x > 2)).toBe(3);
        });

        it("returns first object item matching callback", () => {
            const collection = collect({ a: 1, b: 2, c: 3, d: 4 });
            expect(collection.first((value) => value > 2)).toBe(3);
        });

        it("returns default when empty array", () => {
            const collection = collect([]);
            expect(collection.first(null, "default")).toBe("default");
        });

        it("returns default when empty object", () => {
            const collection = collect({});
            expect(collection.first(null, "default")).toBe("default");
        });

        it("returns default when no match in array", () => {
            const collection = collect<number>([1, 2, 3]);
            expect(collection.first((x) => x > 5, "default")).toBe("default");
        });

        it("returns default when no match in object", () => {
            const collection = collect({ a: 1, b: 2, c: 3 });
            expect(collection.first((value) => value > 5, "default")).toBe(
                "default",
            );
        });

        it("answers null when empty, and a stored null over the default", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-first-empty-no-default"
            expect([
                collect([]).first(),
                collect({ a: null }).first(null, "d"),
            ]).toEqual([null, null]);
        });
    });

    describe("flatten", () => {
        describe("Laravel Tests", () => {
            it("test flatten", () => {
                // CollectionTest::testFlatten
                // Flat arrays are unaffected
                const c = collect(["#foo", "#bar", "#baz"]);
                expect(c.flatten().all()).toEqual(["#foo", "#bar", "#baz"]);

                // Nested arrays are flattened with existing flat items
                const d = collect([["#foo", "#bar"], "#baz"]);
                expect(d.flatten().all()).toEqual(["#foo", "#bar", "#baz"]);

                // Sets of nested arrays are flattened
                const e = collect([["#foo", "#bar"], ["#baz"]]);
                expect(e.flatten().all()).toEqual(["#foo", "#bar", "#baz"]);

                // Deeply nested arrays are flattened
                const f = collect([["#foo", ["#bar"]], ["#baz"]]);
                expect(f.flatten().all()).toEqual(["#foo", "#bar", "#baz"]);

                // Deeply nested arrays with multiple items are flattened
                const g = collect([["#foo", ["#bar", "#zap"]], ["#baz"]]);
                expect(g.flatten().all()).toEqual([
                    "#foo",
                    "#bar",
                    "#zap",
                    "#baz",
                ]);

                // Nested collections are flattened alongside arrays
                const h = collect([collect(["#foo", "#bar"]), ["#baz"]]);
                expect(h.flatten().all()).toEqual(["#foo", "#bar", "#baz"]);

                // Nested collections containing plain arrays are flattened
                const i = collect([collect(["#foo", ["#bar"]]), ["#baz"]]);
                expect(i.flatten().all()).toEqual(["#foo", "#bar", "#baz"]);

                // Nested arrays containing collections are flattened
                const j = collect([["#foo", collect(["#bar"])], ["#baz"]]);
                expect(j.flatten().all()).toEqual(["#foo", "#bar", "#baz"]);

                // Nested arrays containing collections containing arrays are flattened
                const k = collect([
                    ["#foo", collect(["#bar", ["#zap"]])],
                    ["#baz"],
                ]);
                expect(k.flatten().all()).toEqual([
                    "#foo",
                    "#bar",
                    "#zap",
                    "#baz",
                ]);
            });

            it("test flatten with depth", () => {
                // CollectionTest::testFlattenWithDepth
                // No depth flattens recursively
                const c = collect([["#foo", ["#bar", ["#baz"]]], "#zap"]);
                expect(c.flatten().all()).toEqual([
                    "#foo",
                    "#bar",
                    "#baz",
                    "#zap",
                ]);

                const c2 = collect([["#foo", ["#bar", ["#baz"]]], "#zap"]);
                expect(c2.flatten(1).all()).toEqual([
                    "#foo",
                    ["#bar", ["#baz"]],
                    "#zap",
                ]);

                const c3 = collect([["#foo", ["#bar", ["#baz"]]], "#zap"]);
                expect(c3.flatten(2).all()).toEqual([
                    "#foo",
                    "#bar",
                    ["#baz"],
                    "#zap",
                ]);
            });

            it("test flatten with depth 0 flattens fully, not a no-op", () => {
                // PHP: Arr::flatten($a, 0) never hits the depth===1 base case, so it
                // recurses to depth -1, -2, ... and fully flattens, same as Infinity.
                const c = collect([1, [2, [3]]]);
                expect(c.flatten(0).all()).toEqual([1, 2, 3]);
            });

            it("test flatten ignores keys", () => {
                // CollectionTest::testFlattenIgnoresKeys
                // No depth ignores keys
                const c = collect([
                    "#foo",
                    { key: "#bar" },
                    { key: "#baz" },
                    "#zap",
                ]);
                expect(c.flatten().all()).toEqual([
                    "#foo",
                    "#bar",
                    "#baz",
                    "#zap",
                ]);

                // Depth of 1 ignores keys
                const c2 = collect([
                    "#foo",
                    { key: "#bar" },
                    { key: "#baz" },
                    "#zap",
                ]);
                expect(c2.flatten(1).all()).toEqual([
                    "#foo",
                    "#bar",
                    "#baz",
                    "#zap",
                ]);
            });
        });

        it("handles non-array/non-object items", () => {
            // When flattening a collection with primitive items
            const c = collect([1, [2, 3], "string"]);
            const result = c.flatten();
            expect(result.all()).toEqual([1, 2, 3, "string"]);
        });

        it("handles primitive value wrapped in flattenRecursive", () => {
            // Create a scenario where flattenRecursive receives a primitive
            // This happens when an object has a non-array, non-object value at depth
            const c = collect({ a: { b: 5 }, c: 10 });
            const result = c.flatten(1);
            expect(result.all()).toEqual([5, 10]);
        });

        // Arr.php:368 defaults $depth to INF. Array- and object-backed Collections must
        // agree, per the unison rule.
        it("flattens fully by default, either backing", () => {
            expect(
                collect([["#foo", ["#bar", ["#baz"]]], "#zap"])
                    .flatten()
                    .all(),
            ).toEqual(["#foo", "#bar", "#baz", "#zap"]);

            expect(
                collect({ a: { b: { c: { d: 1 } } } })
                    .flatten()
                    .all(),
            ).toEqual([1]);
        });

        it("keeps an object that isn't a plain object whole, on either backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collection-flatten-object-leaf"
            const date = new Date(0);
            const list = collect([date, [1], collect([2, [3]])])
                .flatten()
                .all();
            expect(list).toEqual([date, 1, 2, 3]);
            expect(list[0]).toBe(date);

            const map = new Map([["x", 1]]);
            const fromObject = collect({ a: map, b: [date] })
                .flatten()
                .all();
            expect(fromObject).toEqual([map, date]);
            expect(fromObject[0]).toBe(map);
            expect(fromObject[1]).toBe(date);
        });

        it.fails(
            "flattens a Map-built collection in the order it holds its keys",
            () => {
                // Ordered-backing gap: PHP flattens in insertion order, the item under key 2 first
                // docs/php-parity/task-30-map-order.json, "flatten-out-of-order"
                expect(outOfOrderKeys().flatten().all()).toEqual([
                    "c",
                    "a",
                    "b",
                ]);
            },
        );
    });

    describe("flip", () => {
        it("Laravel Test", () => {
            // CollectionTest::testFlip
            const data = collect({ name: "taylor", framework: "laravel" });
            expect(data.flip().all()).toEqual({
                taylor: "name",
                laravel: "framework",
            });

            const data2 = collect(["apple", "banana", "orange"]);
            expect(data2.flip().all()).toEqual({
                apple: 0,
                banana: 1,
                orange: 2,
            });

            // JS-only: an empty keyed result keeps its record, which JSON writes as PHP's []
            expect(collect([]).flip().all()).toEqual({});
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-keyed-results-empty"
            expect(collect([]).flip().toJson()).toBe("[]");
            expect(collect({ name: "taylor" }).flip().all()).toEqual({
                taylor: "name",
            });
        });

        it("skips unsupported values", () => {
            // CollectionTest::testFlipSkipsUnsupportedValues
            const data = collect({
                string: "taylor",
                integer: 1,
                null: null,
                false: false,
                true: true,
                float: 1.5,
                array: [],
                object: {},
            });
            expect(data.flip().all()).toEqual({
                taylor: "string",
                1: "integer",
            });
        });
    });

    describe("forget", () => {
        describe("Laravel Tests", () => {
            it("test forget single key", () => {
                // CollectionTest::testForgetSingleKey
                const c = collect(["bar", "qux"]).forget(0).all();
                expect(c).toEqual(["qux"]);

                const d = collect({ foo: "bar", baz: "qux" })
                    .forget("foo")
                    .all();
                expect(d).toEqual({ baz: "qux" });
            });

            it("test forget array of keys", () => {
                // CollectionTest::testForgetArrayOfKeys
                const d = collect(["foo", "bar", "baz"]).forget([0, 2]).all();
                expect(d).toEqual(["bar"]);

                const c = collect({ name: "taylor", foo: "bar", baz: "qux" })
                    .forget(["foo", "baz"])
                    .all();
                expect(c).toEqual({ name: "taylor" });
            });

            it("test forget collection of keys", () => {
                // CollectionTest::testForgetCollectionOfKeys
                const c = collect(["foo", "bar", "baz"]);
                const res = c.forget(collect([0, 2])).all();
                expect(res).toEqual(["bar"]);

                const d = collect({ name: "taylor", foo: "bar", baz: "qux" });
                const res2 = d.forget(collect(["foo", "baz"])).all();
                expect(res2).toEqual({ name: "taylor" });
            });
        });

        it("reads a dotted key literally, never as a path", () => {
            const collection = collect({ a: { b: 1 } }).forget("a.b");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-forget-dot-path-is-literal"
            expect(collection.all()).toEqual({ a: { b: 1 } });
            expect(collection.keys().all()).toEqual(["a"]);
            expect(collection.values().all()).toEqual([{ b: 1 }]);
        });

        it("reads a null among the keys as the '' key and unsets a float's integer part, as offsetUnset does", () => {
            const forgotten = collect({ "": 1, a: 2 }).forget([null]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-except-forget-null-key"
            expect(collect({ "": 1, a: 2 }).forget(null).all()).toEqual({
                "": 1,
                a: 2,
            });
            expect([forgotten.keys().all(), forgotten.values().all()]).toEqual([
                ["a"],
                [2],
            ]);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-except-float-key"
            expect(collect({ "1.5": "a", 1: "b" }).forget([1.5]).all()).toEqual(
                {
                    "1.5": "a",
                },
            );
        });

        it("drops a repeated key once", () => {
            const collection = collect(["a", "b", "c"]).forget([1, 1]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-forget-repeated-key-on-list"
            // PHP keeps the gap ({0: "a", 2: "c"}); a list backing reindexes, as a JS array holds no sparse keys.
            expect(collection.all()).toEqual(["a", "c"]);
            expect(collection.keys().all()).toEqual([0, 1]);
            expect(collection.values().all()).toEqual(["a", "c"]);
        });
    });

    describe("get", () => {
        describe("Laravel Tests", () => {
            it("test get with null returns null", () => {
                // CollectionTest::testGetWithNullReturnsNull
                const data = new Collection([1, 2, 3]);
                expect(data.get(null)).toBeNull();
            });

            it("test get with callback as default value", () => {
                // CollectionTest::testGetWithCallbackAsDefaultValue
                const data = new Collection({
                    name: "taylor",
                    framework: "laravel",
                });
                const result = data.get("email", () => "taylor@example.com");
                expect(result).toBe("taylor@example.com");
            });
        });

        it("reads a null key as the empty-string key", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-get-null-on-list"
            expect(collect([1, 2, 3]).get(null)).toBeNull();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-get-null-empty-string-key"
            expect(collect({ "": "x" }).get(null)).toBe("x");

            // JS-only: an undefined key reads as null does
            expect(collect([1, 2, 3]).get(undefined)).toBeNull();
            expect(collect({ "": "x" }).get(undefined)).toBe("x");
        });

        it("answers a stored null rather than the default", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-get-stored-null-beats-default"
            expect(collect({ a: null }).get("a", "d")).toBeNull();

            // JS-only: a stored undefined is an item, as a stored null is
            expect(collect({ a: undefined }).get("a", "d")).toBeUndefined();
        });

        it("gets value by key in object", () => {
            const collection = collect({ a: 1, b: 2, c: 3 });
            expect(collection.get("b")).toBe(2);
        });

        it("gets value by key in array", () => {
            const collection = collect([1, 2, 3]);
            expect(collection.get(1)).toBe(2);
        });

        it("returns default for missing object key", () => {
            // CollectionTest::testGetWithDefaultValue
            const collection = collect({ a: 1, b: 2, c: 3 });
            expect(collection.get("d", "default")).toBe("default");
        });

        it("returns default for missing array index", () => {
            const collection = collect([1, 2, 3]);
            expect(collection.get(5, "default")).toBe("default");
        });

        it("get() reads a literal dotted key, through the object backing", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-get-has-literal-dotted-key"
            const collection = collect({ "products.desk": { price: 100 } });
            expect(collection.get("products.desk")).toEqual({ price: 100 });
        });

        it("reads a dotted key literally, never as a path", () => {
            // docs/php-parity/task-26-collection-order.json, "get-dot-path-is-a-literal-key"
            expect(collect({ a: { b: 1 } }).get("a.b", "fallback")).toBe(
                "fallback",
            );
        });

        it("returns the default for a non-canonical index on a list backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collection-get-list-non-canonical-index"
            expect(collect(["x", "y"]).get("01", "d")).toBe("d");
        });
    });

    describe("getOrPut", () => {
        describe("Laravel tests", () => {
            it("test get or put", () => {
                // CollectionTest::testGetOrPut
                const data = collect({ name: "taylor", email: "foo" });
                expect(data.getOrPut("name", null)).toBe("taylor");
                expect(data.getOrPut("email", null)).toBe("foo");
                expect(data.getOrPut("gender", "male")).toBe("male");

                expect(data.get("name")).toBe("taylor");
                expect(data.get("email")).toBe("foo");
                expect(data.get("gender")).toBe("male");

                const data2 = collect({ name: "taylor", email: "foo" });
                expect(data2.getOrPut("name", () => null)).toBe("taylor");
                expect(data2.getOrPut("email", () => null)).toBe("foo");
                expect(data2.getOrPut("gender", () => "male")).toBe("male");

                expect(data2.get("name")).toBe("taylor");
                expect(data2.get("email")).toBe("foo");
                expect(data2.get("gender")).toBe("male");
            });

            it("test get or put with no key", () => {
                // CollectionTest::testGetOrPutWithNoKey
                const data = collect(["taylor", "shawn"]);
                expect(data.getOrPut(null, "dayle")).toBe("dayle");
                expect(data.getOrPut(null, "john")).toBe("john");
                expect(data.all()).toEqual([
                    "taylor",
                    "shawn",
                    "dayle",
                    "john",
                ]);

                const data2 = collect({ 0: "taylor", "": "shawn" });
                expect(data2.getOrPut(null, "dayle")).toBe("shawn");
                expect(data2.all()).toEqual({ 0: "taylor", "": "shawn" });
            });
        });

        it("writes a dotted key as one literal key, never reading it as a path", () => {
            const collection = collect({ a: { b: 1 } });
            const returned = collection.getOrPut("a.b", 9);

            // docs/php-parity/task-26-collection-order.json, "getOrPut-dot-path-is-a-literal-key"
            expect({ returned, all: collection.all() }).toEqual({
                returned: 9,
                all: { a: { b: 1 }, "a.b": 9 },
            });
            expect(collection.keys().all()).toEqual(["a", "a.b"]);
            expect(collection.values().all()).toEqual([{ b: 1 }, 9]);
        });
    });

    describe("groupBy", () => {
        /** Each entry as the probes write it, [key, its PHP type, value], a group as { Collection: its entries }. */
        const groupPairs = <
            TValue,
            TKey extends PropertyKey,
            TShape extends CollectionShape,
        >(
            collection: Collection<TValue, TKey, TShape>,
        ): unknown[] => {
            const values = [...collection.values()];

            return [...collection.keys()].map((key, index) => {
                const value = values[index];

                return [
                    key,
                    isString(key) ? "string" : "integer",
                    value instanceof Collection
                        ? { Collection: groupPairs(value) }
                        : value,
                ];
            });
        };

        describe("Laravel Tests", () => {
            it("test group by attribute", () => {
                // CollectionTest::testGroupByAttribute
                const data = collect([
                    { rating: 1, url: "1" },
                    { rating: 1, url: "1" },
                    { rating: 2, url: "2" },
                ]);

                const resultByRating = data.groupBy("rating");
                expect(resultByRating.toArray()).toEqual({
                    1: [
                        { rating: 1, url: "1" },
                        { rating: 1, url: "1" },
                    ],
                    2: [{ rating: 2, url: "2" }],
                });

                const resultByUrl = data.groupBy("url");
                expect(resultByUrl.toArray()).toEqual({
                    1: [
                        { rating: 1, url: "1" },
                        { rating: 1, url: "1" },
                    ],
                    2: [{ rating: 2, url: "2" }],
                });
            });

            it("test group by attribute with stringable key", () => {
                // CollectionTest::testGroupByAttributeWithStringableKey: PHP's anonymous class with a __toString
                // is a class instance here, since a plain object models an array of group keys.
                const payload = [
                    { name: new Stringable("Laravel"), url: "1" },
                    { name: new Stringable("Laravel"), url: "1" },
                    {
                        name: new (class {
                            toString(): string {
                                return "Framework";
                            }
                        })(),
                        url: "2",
                    },
                ];
                const data = collect(payload);

                const resultByName = data.groupBy("name");
                expect(resultByName.toArray()).toEqual({
                    Laravel: [payload[0], payload[1]],
                    Framework: [payload[2]],
                });

                const resultByUrl = data.groupBy("url");
                expect(resultByUrl.toArray()).toEqual({
                    1: [payload[0], payload[1]],
                    2: [payload[2]],
                });
            });

            it("test group by attribute with enum key", () => {
                // CollectionTest::testGroupByAttributeWithEnumKey
                const payload = [
                    { name: TestEnum.from("A"), url: "1" },
                    { name: TestBackedEnum.from(1), url: "1" },
                    { name: TestStringBackedEnum.from("A"), url: "2" },
                ];
                const data = collect(payload);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-groupBy-enum-key"
                expect(data.groupBy("name").toArray()).toEqual({
                    A: [payload[0], payload[2]],
                    1: [payload[1]],
                });
                expect(data.groupBy("url").toArray()).toEqual({
                    1: [payload[0], payload[1]],
                    2: [payload[2]],
                });
            });

            it("test group by attribute with backed enum key", () => {
                // CollectionTest::testGroupByAttributeWithBackedEnumKey
                const data = collect([
                    { rating: TestBackedEnum.from(1), url: "1" },
                    { rating: TestBackedEnum.from(2), url: "1" },
                ]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-groupBy-backed-enum-key"
                expect(data.groupBy("rating").toArray()).toEqual({
                    1: [{ rating: TestBackedEnum.from(1), url: "1" }],
                    2: [{ rating: TestBackedEnum.from(2), url: "1" }],
                });
            });

            it("test group by callable", () => {
                // CollectionTest::testGroupByCallable, with closures standing in for its array callables
                const data = collect([
                    { rating: 1, url: "1" },
                    { rating: 1, url: "1" },
                    { rating: 2, url: "2" },
                ]);

                const resultByRating = data.groupBy((item) => item.rating);
                expect(resultByRating.toArray()).toEqual({
                    1: [
                        { rating: 1, url: "1" },
                        { rating: 1, url: "1" },
                    ],
                    2: [{ rating: 2, url: "2" }],
                });

                const resultByUrl = data.groupBy((item) => item.url);
                expect(resultByUrl.toArray()).toEqual({
                    1: [
                        { rating: 1, url: "1" },
                        { rating: 1, url: "1" },
                    ],
                    2: [{ rating: 2, url: "2" }],
                });
            });

            it("test group by attribute preserving keys", () => {
                // CollectionTest::testGroupByAttributePreservingKeys
                const data = collect({
                    10: { rating: 1, url: "1" },
                    20: { rating: 1, url: "1" },
                    30: { rating: 2, url: "2" },
                });

                const result = data.groupBy("rating", true);

                const expected_result = {
                    1: {
                        10: { rating: 1, url: "1" },
                        20: { rating: 1, url: "1" },
                    },
                    2: {
                        30: { rating: 2, url: "2" },
                    },
                };

                expect(result.toArray()).toEqual(expected_result);
            });

            it("test group by closure where items have single group", () => {
                // CollectionTest::testGroupByClosureWhereItemsHaveSingleGroup
                const data = collect([
                    { rating: 1, url: "1" },
                    { rating: 1, url: "1" },
                    { rating: 2, url: "2" },
                ]);

                const result = data.groupBy((item) => item.rating);

                const expected_result = {
                    1: [
                        { rating: 1, url: "1" },
                        { rating: 1, url: "1" },
                    ],
                    2: [{ rating: 2, url: "2" }],
                };

                expect(result.toArray()).toEqual(expected_result);
            });

            it("test group by closure where items have single group preserving keys", () => {
                // CollectionTest::testGroupByClosureWhereItemsHaveSingleGroupPreservingKeys
                const data = collect({
                    10: { rating: 1, url: "1" },
                    20: { rating: 1, url: "1" },
                    30: { rating: 2, url: "2" },
                });

                const result = data.groupBy((item) => item.rating, true);

                const expected_result = {
                    1: {
                        10: { rating: 1, url: "1" },
                        20: { rating: 1, url: "1" },
                    },
                    2: {
                        30: { rating: 2, url: "2" },
                    },
                };

                expect(result.toArray()).toEqual(expected_result);
            });

            it("test group by closure where items have multiple groups", () => {
                // CollectionTest::testGroupByClosureWhereItemsHaveMultipleGroups
                const data = collect([
                    { user: 1, roles: ["Role_1", "Role_3"] },
                    { user: 2, roles: ["Role_1", "Role_2"] },
                    { user: 3, roles: ["Role_1"] },
                ]);

                const result = data.groupBy((item) => item.roles);

                const expected_result = {
                    Role_1: [
                        { user: 1, roles: ["Role_1", "Role_3"] },
                        { user: 2, roles: ["Role_1", "Role_2"] },
                        { user: 3, roles: ["Role_1"] },
                    ],
                    Role_2: [{ user: 2, roles: ["Role_1", "Role_2"] }],
                    Role_3: [{ user: 1, roles: ["Role_1", "Role_3"] }],
                };

                expect(result.toArray()).toEqual(expected_result);
            });

            it("test group by closure where items have multiple groups preserving keys", () => {
                // CollectionTest::testGroupByClosureWhereItemsHaveMultipleGroupsPreservingKeys
                const data = collect({
                    10: { user: 1, roles: ["Role_1", "Role_3"] },
                    20: { user: 2, roles: ["Role_1", "Role_2"] },
                    30: { user: 3, roles: ["Role_1"] },
                });

                const result = data.groupBy((item) => item.roles, true);

                const expected_result = {
                    Role_1: {
                        10: { user: 1, roles: ["Role_1", "Role_3"] },
                        20: { user: 2, roles: ["Role_1", "Role_2"] },
                        30: { user: 3, roles: ["Role_1"] },
                    },
                    Role_2: {
                        20: { user: 2, roles: ["Role_1", "Role_2"] },
                    },
                    Role_3: {
                        10: { user: 1, roles: ["Role_1", "Role_3"] },
                    },
                };

                expect(result.toArray()).toEqual(expected_result);
            });

            it("test group by multi-level and closure preserving keys", () => {
                // CollectionTest::testGroupByMultiLevelAndClosurePreservingKeys
                const data = collect({
                    10: { user: 1, skilllevel: 1, roles: ["Role_1", "Role_3"] },
                    20: { user: 2, skilllevel: 1, roles: ["Role_1", "Role_2"] },
                    30: { user: 3, skilllevel: 2, roles: ["Role_1"] },
                    40: { user: 4, skilllevel: 2, roles: ["Role_2"] },
                });

                const result = data.groupBy(
                    ["skilllevel", (item) => item.roles],
                    true,
                );

                const expected_result = {
                    1: {
                        Role_1: {
                            10: {
                                user: 1,
                                skilllevel: 1,
                                roles: ["Role_1", "Role_3"],
                            },
                            20: {
                                user: 2,
                                skilllevel: 1,
                                roles: ["Role_1", "Role_2"],
                            },
                        },
                        Role_3: {
                            10: {
                                user: 1,
                                skilllevel: 1,
                                roles: ["Role_1", "Role_3"],
                            },
                        },
                        Role_2: {
                            20: {
                                user: 2,
                                skilllevel: 1,
                                roles: ["Role_1", "Role_2"],
                            },
                        },
                    },
                    2: {
                        Role_1: {
                            30: {
                                user: 3,
                                skilllevel: 2,
                                roles: ["Role_1"],
                            },
                        },
                        Role_2: {
                            40: {
                                user: 4,
                                skilllevel: 2,
                                roles: ["Role_2"],
                            },
                        },
                    },
                };

                expect(result.toArray()).toEqual(expected_result);
            });

            it("test group by null", () => {
                // CollectionTest::testGroupByNull
                const payload = [
                    { name: "a", url: "1" },
                    { name: "b", url: null },
                    { name: "c", url: null },
                ];
                const data = collect(payload);

                const result = data.groupBy("url");
                expect(result.toArray()).toEqual({
                    1: [payload[0]],
                    "": [payload[1], payload[2]],
                });
            });
        });

        it("groups by the values themselves when the list of groupings is empty or names null", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-groupBy-empty-and-null-array-arg"
            const expected = [
                [
                    1,
                    "integer",
                    {
                        Collection: [
                            [0, "integer", 1],
                            [1, "integer", 1],
                        ],
                    },
                ],
                [2, "integer", { Collection: [[0, "integer", 2]] }],
            ];

            expect(groupPairs(collect([1, 2, 1]).groupBy([]))).toEqual(
                expected,
            );
            expect(groupPairs(collect([1, 2, 1]).groupBy([null]))).toEqual(
                expected,
            );
        });

        it("groups by the values themselves when the list of groupings names undefined", () => {
            // JS-only: undefined is read as PHP's null, so this gives the "null" answer of
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-groupBy-empty-and-null-array-arg"
            expect(groupPairs(collect([1, 2, 1]).groupBy([undefined]))).toEqual(
                [
                    [
                        1,
                        "integer",
                        {
                            Collection: [
                                [0, "integer", 1],
                                [1, "integer", 1],
                            ],
                        },
                    ],
                    [2, "integer", { Collection: [[0, "integer", 2]] }],
                ],
            );
        });

        it("group key is boolean", () => {
            const collection = collect([{ active: true }, { active: false }]);
            const grouped = collection.groupBy("active");
            expect(grouped.toArray()).toEqual({
                1: [{ active: true }],
                0: [{ active: false }],
            });
        });

        it("group key is null", () => {
            const collection = collect([{ value: null }, { value: 1 }]);
            const grouped = collection.groupBy("value");
            expect(grouped.toArray()).toEqual({
                "": [{ value: null }],
                1: [{ value: 1 }],
            });
        });

        it("group key is undefined", () => {
            // JS-only: undefined is read as PHP's null, which groups under the "" key
            const collection = collect([{ value: undefined }, { value: 1 }]);
            const grouped = collection.groupBy("value");
            expect(grouped.toArray()).toEqual({
                "": [{ value: undefined }],
                1: [{ value: 1 }],
            });
        });

        it("group key is array", () => {
            const collection = collect([
                { tags: ["tag1", "tag2"] },
                { tags: ["tag2", "tag3"] },
            ]);
            const grouped = collection.groupBy("tags");
            expect(grouped.toArray()).toEqual({
                tag1: [{ tags: ["tag1", "tag2"] }],
                tag2: [{ tags: ["tag1", "tag2"] }, { tags: ["tag2", "tag3"] }],
                tag3: [{ tags: ["tag2", "tag3"] }],
            });
        });

        it("hands back each group as a collection", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-groupBy-groups-are-collections"
            const grouped = collect([{ r: 1 }, { r: 1 }]).groupBy("r");

            expect(grouped.get(1)).toBeInstanceOf(Collection);
            expect(grouped.toArray()).toEqual({ 1: [{ r: 1 }, { r: 1 }] });
            expect(grouped.keys().all()).toEqual([1]);
            expect(grouped.values().toArray()).toEqual([[{ r: 1 }, { r: 1 }]]);

            const byInitial = collect(["apple", "banana", "apricot"]).groupBy(
                (item) => item[0],
            );

            expect(byInitial.get("a")).toBeInstanceOf(Collection);
            expect(byInitial.get("b")).toBeInstanceOf(Collection);
            expect(byInitial.toArray()).toEqual({
                a: ["apple", "apricot"],
                b: ["banana"],
            });
            expect(byInitial.keys().all()).toEqual(["a", "b"]);
            expect(byInitial.values().toArray()).toEqual([
                ["apple", "apricot"],
                ["banana"],
            ]);
        });

        it("hands back the groups of a multi-level grouping as collections at every level", () => {
            const rows = {
                10: { user: 1, skilllevel: 1, roles: ["Role_1", "Role_3"] },
                20: { user: 2, skilllevel: 1, roles: ["Role_1", "Role_2"] },
                30: { user: 3, skilllevel: 2, roles: ["Role_1"] },
                40: { user: 4, skilllevel: 2, roles: ["Role_2"] },
            };

            const result = collect(rows).groupBy(
                ["skilllevel", (item) => item.roles],
                true,
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-groupBy-multilevel-shape", with each
            // row where the probe writes its user
            expect(groupPairs(result)).toEqual([
                [
                    1,
                    "integer",
                    {
                        Collection: [
                            [
                                "Role_1",
                                "string",
                                {
                                    Collection: [
                                        [10, "integer", rows[10]],
                                        [20, "integer", rows[20]],
                                    ],
                                },
                            ],
                            [
                                "Role_3",
                                "string",
                                { Collection: [[10, "integer", rows[10]]] },
                            ],
                            [
                                "Role_2",
                                "string",
                                { Collection: [[20, "integer", rows[20]]] },
                            ],
                        ],
                    },
                ],
                [
                    2,
                    "integer",
                    {
                        Collection: [
                            [
                                "Role_1",
                                "string",
                                { Collection: [[30, "integer", rows[30]]] },
                            ],
                            [
                                "Role_2",
                                "string",
                                { Collection: [[40, "integer", rows[40]]] },
                            ],
                        ],
                    },
                ],
            ]);
        });

        it("keeps a list's own keys in each group when preserving keys", () => {
            const grouped = collect(["a", "b", "c"]).groupBy(
                (_value, key) => (key % 2 ? "odd" : "even"),
                true,
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-groupBy-preserve-keys-list-backing"
            expect(groupPairs(grouped)).toEqual([
                [
                    "even",
                    "string",
                    {
                        Collection: [
                            [0, "integer", "a"],
                            [2, "integer", "c"],
                        ],
                    },
                ],
                ["odd", "string", { Collection: [[1, "integer", "b"]] }],
            ]);
            expect(grouped.toArray()).toEqual({
                even: { 0: "a", 2: "c" },
                odd: { 1: "b" },
            });
        });

        it("groups items under an empty string key when callback returns null or undefined", () => {
            const c = collect(["apple", "", "banana"]);
            // JS-only: an empty string's first character is undefined, which is read as PHP's null
            const grouped = c.groupBy((item) => item[0]);
            expect(grouped.toArray()).toEqual({
                a: ["apple"],
                "": [""],
                b: ["banana"],
            });

            // Test with explicit null return
            const c2 = collect([1, 2, 3, 4, 5]);
            const grouped2 = c2.groupBy((item) => (item > 3 ? "big" : null));
            expect(grouped2.toArray()).toEqual({
                big: [4, 5],
                "": [1, 2, 3],
            });
        });

        it.fails(
            "keeps a Map-built collection's keys in each group in the order it holds them",
            () => {
                const grouped = collect(
                    new Map<string | number, string>([
                        ["x", "p"],
                        [5, "q"],
                    ]),
                ).groupBy(() => "g", true);

                // Ordered-backing gap: PHP keeps a group's keys in insertion order, x before 5
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-groupBy-preserve-keys-mixed-order"
                expect(groupPairs(grouped)).toEqual([
                    [
                        "g",
                        "string",
                        {
                            Collection: [
                                ["x", "string", "p"],
                                [5, "integer", "q"],
                            ],
                        },
                    ],
                ]);
            },
        );
    });

    describe("keyBy", () => {
        describe("Laravel Tests", () => {
            it("test key by attribute", () => {
                // CollectionTest::testKeyByAttribute
                const data = collect([
                    { rating: 1, name: "1" },
                    { rating: 2, name: "2" },
                    { rating: 3, name: "3" },
                ]);

                const resultByRating = data.keyBy("rating");
                expect(resultByRating.all()).toEqual({
                    1: { rating: 1, name: "1" },
                    2: { rating: 2, name: "2" },
                    3: { rating: 3, name: "3" },
                });

                const resultByDoubleRating = data.keyBy(
                    (item) => item.rating * 2,
                );
                expect(resultByDoubleRating.all()).toEqual({
                    2: { rating: 1, name: "1" },
                    4: { rating: 2, name: "2" },
                    6: { rating: 3, name: "3" },
                });
            });

            it("test key by closure", () => {
                // CollectionTest::testKeyByClosure
                const data = collect([
                    { firstname: "Taylor", lastname: "Otwell", locale: "US" },
                    { firstname: "Lucas", lastname: "Michot", locale: "FR" },
                ]);

                const result = data.keyBy((item, key) =>
                    `${key}-${item.firstname}${item.lastname}`.toLowerCase(),
                );

                expect(result.all()).toEqual({
                    "0-taylorotwell": {
                        firstname: "Taylor",
                        lastname: "Otwell",
                        locale: "US",
                    },
                    "1-lucasmichot": {
                        firstname: "Lucas",
                        lastname: "Michot",
                        locale: "FR",
                    },
                });
            });

            it("test key by object", () => {
                // CollectionTest::testKeyByObject
                const data = collect([
                    { firstname: "Taylor", lastname: "Otwell", locale: "US" },
                    { firstname: "Lucas", lastname: "Michot", locale: "FR" },
                ]);

                const result = data.keyBy((item, key) => {
                    return collect([key, item.firstname, item.lastname]);
                });

                expect(result.all()).toEqual({
                    '[0,"Taylor","Otwell"]': {
                        firstname: "Taylor",
                        lastname: "Otwell",
                        locale: "US",
                    },
                    '[1,"Lucas","Michot"]': {
                        firstname: "Lucas",
                        lastname: "Michot",
                        locale: "FR",
                    },
                });
            });

            it("test key by null", () => {
                // CollectionTest::testKeyByNull
                const data = collect([
                    { rating: 1, name: "1" },
                    { rating: 2, name: null },
                ]);

                const result = data.keyBy("name");
                expect(result.all()).toEqual({
                    1: { rating: 1, name: "1" },
                    "": { rating: 2, name: null },
                });
            });
        });

        it("keys items with an undefined key value under an empty string key", () => {
            const data = collect([{ rating: 1, name: "1" }, { rating: 2 }]);

            const result = data.keyBy("name");
            expect(result.all()).toEqual({
                1: { rating: 1, name: "1" },
                "": { rating: 2 },
            });
        });

        it("throws for a plain object key, which PHP cannot store", () => {
            const collection = collect([
                { id: { name: "John" } },
                { id: { name: "Jane" } },
            ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-keyBy-assoc-key"
            expect(() => collection.keyBy((item) => item.id)).toThrow(
                new TypeError("Cannot access offset of type array on array"),
            );
        });

        it("throws for an array key, which PHP cannot store", () => {
            const collection = collect([{ id: [1, 2] }, { id: [3, 4] }]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-keyBy-array-key"
            expect(() => collection.keyBy((item) => item.id)).toThrow(
                new TypeError("Cannot access offset of type array on array"),
            );
        });

        it("works with object collection (non-array items)", () => {
            // Test keyBy with object-based collection
            const collection = collect({
                a: { rating: 1, name: "one" },
                b: { rating: 2, name: "two" },
                c: { rating: 3, name: "three" },
            });
            const result = collection.keyBy("rating");
            expect(result.all()).toEqual({
                1: { rating: 1, name: "one" },
                2: { rating: 2, name: "two" },
                3: { rating: 3, name: "three" },
            });
        });

        it("keys by a string-backed enum case's value", () => {
            // CollectionTest::testKeyByBackedEnum
            const data = collect([
                { id: 1, status: TestStringBackedEnum.from("A") },
                { id: 2, status: TestStringBackedEnum.from("B") },
            ]);

            expect(data.keyBy("status").all()).toEqual({
                A: { id: 1, status: TestStringBackedEnum.from("A") },
                B: { id: 2, status: TestStringBackedEnum.from("B") },
            });
        });

        it("keys by an int-backed or a pure enum case's value", () => {
            const data = collect([
                { id: 1, s: TestBackedEnum.from(2) },
                { id: 2, s: TestBackedEnum.from(1) },
            ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-keyBy-enum-keys"
            expect(
                data
                    .keyBy("s")
                    .map((row) => row.id)
                    .all(),
            ).toEqual({ 2: 1, 1: 2 });
            expect(
                collect([1])
                    .keyBy(() => TestEnum.from("A"))
                    .keys()
                    .all(),
            ).toEqual(["A"]);
        });

        it("throws for a plain object that only looks like an enum case", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-keyBy-assoc-key": without an own
            // string name and a string or number value, a plain object models an array, not a case.
            const data = collect([{ id: 1, meta: { value: null } }]);

            expect(() => data.keyBy("meta")).toThrow(
                new TypeError("Cannot access offset of type array on array"),
            );
        });

        it("casts a bool, null or float key the way PHP stores an array offset", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collection-keyBy-scalar-key-cast"
            expect(
                collect({ a: { k: true }, b: { k: false }, c: { k: null } })
                    .keyBy("k")
                    .all(),
            ).toEqual({ 1: { k: true }, 0: { k: false }, "": { k: null } });
            expect(
                collect([{ v: 1 }])
                    .keyBy(() => 2.5)
                    .keys()
                    .all(),
            ).toEqual([2]);
        });

        it("keys an item under a symbol the callback returns", () => {
            // JS-only: PHP has no symbols; a symbol key is kept as it is, as arr and obj keyBy keep it.
            const sym = Symbol("test");
            const result = collect([{ v: 1 }])
                .keyBy(() => sym)
                .all() as Record<symbol, unknown>;
            expect(result[sym]).toEqual({ v: 1 });
        });
    });

    describe("has", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testHas
            const data = collect({ id: 1, first: "Hello", second: "World" });
            expect(data.has("first")).toBe(true);
            expect(data.has("third")).toBe(false);
            expect(data.has(["first", "second"])).toBe(true);
            expect(data.has(["third", "first"])).toBe(false);
            expect(data.has("first", "second")).toBe(true);
        });

        it("checks if key exists in object", () => {
            const collection = collect({ a: 1, b: 2, c: 3 });
            expect(collection.has("a")).toBe(true);
            expect(collection.has("d")).toBe(false);
        });

        it("checks if index exists in array", () => {
            const collection = collect([1, 2, 3]);
            expect(collection.has(0)).toBe(true);
            expect(collection.has(5)).toBe(false);
        });

        it("checks multiple keys in object", () => {
            const collection = collect({ a: 1, b: 2, c: 3 });
            expect(collection.has(["a", "b"])).toBe(true);
            expect(collection.has(["a", "d"])).toBe(false);
        });

        it("checks multiple indices in array", () => {
            const collection = collect([1, 2, 3]);
            expect(collection.has([0, 1])).toBe(true);
            expect(collection.has([0, 5])).toBe(false);
        });

        it("has() finds a literal dotted key, through the object backing", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-get-has-literal-dotted-key"
            const collection = collect({ "products.desk": { price: 100 } });
            expect(collection.has("products.desk")).toBe(true);
        });

        it("finds a numeric key on a plain object, not only on arrays", () => {
            // PHP-verified: docs/php-parity/task-09-paths.json, "Arr::has
            // — numeric key".
            const collection = collect({ 123: "x" });
            expect(collection.has(123)).toBe(true);
        });

        it("does not leak Array.prototype through the array backing", () => {
            // JS-only: a JS array carries a length and methods, which PHP's array never holds as keys
            const collection = collect([1, 2]);
            expect(collection.has("length")).toBe(false);
            expect(collection.has("toString")).toBe(false);
        });

        it("looks up the empty-string key for a null inside a key list, through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "has-empty-string-key-null-in-list"
            const collection = collect({ "": "some" });
            expect(collection.has([null])).toBe(true);
        });

        it("test has returns valid results", () => {
            // CollectionTest::testHasReturnsValidResults
            const data = new Collection({ foo: "one", bar: "two", 1: "three" });
            expect(data.has("foo")).toBe(true);
            expect(data.has("foo", "bar", 1)).toBe(true);
            expect(data.has("foo", "bar", 1, "baz")).toBe(false);
            expect(data.has("baz")).toBe(false);
        });

        it("reads a null key as the empty-string key", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-has-null-key"
            expect([
                collect({ a: 1 }).has(null),
                collect({ "": 1 }).has(null),
            ]).toEqual([false, true]);
        });

        it("answers true for an empty key list, as no key in it is missing", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-has-empty-key-list"
            expect([collect({ a: 1 }).has([]), collect([]).has([])]).toEqual([
                true,
                true,
            ]);
        });

        it("reads an array first argument as the whole key list, ignoring the rest", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-has-array-ignores-extra-args"
            expect(collect({ first: 1 }).has(["first"], "third")).toBe(true);
        });

        it("reads a dotted key literally, never as a path", () => {
            // docs/php-parity/task-26-collection-order.json, "has-dot-path-is-a-literal-key"
            expect(collect({ a: { b: 1 } }).has("a.b")).toBe(false);
        });
    });

    describe("hasAny", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testHasAny
            const data = collect({ id: 1, first: "Hello", second: "World" });

            expect(data.hasAny("first")).toBe(true);
            expect(data.hasAny("third")).toBe(false);
            expect(data.hasAny(["first", "second"])).toBe(true);
            expect(data.hasAny(["first", "fourth"])).toBe(true);
            expect(data.hasAny(["third", "fourth"])).toBe(false);
            expect(data.hasAny("third", "fourth")).toBe(false);
            expect(data.hasAny([])).toBe(false);
        });

        it("test has any if collection is empty", () => {
            expect(collect().hasAny("key", "any", [0, 1], "test")).toBe(false);
        });

        it("reads a null key as the empty-string key", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-hasAny-null-key"
            expect([
                collect({ "": 1 }).hasAny(null),
                collect({ a: 1 }).hasAny(null),
                collect({ "": 1 }).hasAny([null]),
            ]).toEqual([true, false, true]);
        });

        it("reads an array first argument as the whole key list, ignoring the rest", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-has-array-ignores-extra-args"
            expect(collect({ first: 1 }).hasAny(["third"], "first")).toBe(
                false,
            );
        });

        it("reads a dotted key literally, never as a path", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-hasAny-dot-path-is-literal"
            expect([
                collect({ a: { b: 1 } }).hasAny("a.b"),
                collect({ "a.b": 1 }).hasAny("a.b"),
            ]).toEqual([false, true]);
        });
    });

    describe("implode", () => {
        describe("Laravel Tests", () => {
            it("test implode", () => {
                // CollectionTest::testImplode
                const data = collect([
                    { name: "taylor", email: "foo" },
                    { name: "dayle", email: "bar" },
                ]);
                expect(data.implode("email")).toBe("foobar");
                expect(data.implode("email", ",")).toBe("foo,bar");

                const data2 = collect(["taylor", "dayle"]);
                expect(data2.implode("")).toBe("taylordayle");
                expect(data2.implode(",")).toBe("taylor,dayle");

                const data3 = collect([
                    {
                        name: new Stringable("taylor"),
                        email: new Stringable("foo"),
                    },
                    {
                        name: new Stringable("dayle"),
                        email: new Stringable("bar"),
                    },
                ]);
                expect(data3.implode("email")).toBe("foobar");
                expect(data3.implode("email", ",")).toBe("foo,bar");

                const data4 = collect([
                    new Stringable("taylor"),
                    new Stringable("dayle"),
                ]);
                expect(data4.implode("")).toBe("taylordayle");
                expect(data4.implode(",")).toBe("taylor,dayle");
                expect(data4.implode("_")).toBe("taylor_dayle");

                const data5 = collect([
                    { name: "taylor", email: "foo" },
                    { name: "dayle", email: "bar" },
                ]);
                expect(
                    data5.implode((user) => `${user.name}-${user.email}`),
                ).toBe("taylor-foodayle-bar");
                expect(
                    data5.implode((user) => `${user.name}-${user.email}`, ","),
                ).toBe("taylor-foo,dayle-bar");
            });

            it("test implode models", () => {
                // CollectionTest::testImplodeModels, whose Eloquent models a class with a public property stands in for
                class Model {
                    email: string;

                    constructor(email: string) {
                        this.email = email;
                    }
                }

                const data = collect([new Model("foo"), new Model("bar")]);

                expect(data.implode("email")).toBe("foobar");
                expect(data.implode("email", ",")).toBe("foo,bar");
            });
        });

        it("plucks a key from class instances, as PHP plucks one from any object but a Stringable", () => {
            class User {
                email: string;

                constructor(email: string) {
                    this.email = email;
                }
            }

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-implode-class-instances-by-key"
            expect(
                collect([new User("foo"), new User("bar")]).implode(
                    "email",
                    ",",
                ),
            ).toBe("foo,bar");
        });

        it("plucks a key from Collection rows, though their toString is their JSON", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-implode-nested-collections-by-key"
            expect(
                collect([collect({ a: "x" }), collect({ a: "y" })]).implode(
                    "a",
                    ",",
                ),
            ).toBe("x,y");
        });

        it("plucks a key from Map rows and rows without a prototype, as from the arrays they stand for", () => {
            const bare = (email: string) =>
                Object.assign(Object.create(null) as { email: string }, {
                    email,
                });

            // CollectionTest::testImplode
            // JS-only: a Map and an object without a prototype each stand for a PHP array, as testImplode's rows are
            expect([
                collect([
                    new Map([["email", "foo"]]),
                    new Map([["email", "bar"]]),
                ]).implode("email", ","),
                collect([bare("foo"), bare("bar")]).implode("email", ","),
            ]).toEqual(["foo,bar", "foo,bar"]);
        });

        it("joins an object with its own toString as it is, where PHP plucks it", () => {
            class Label {
                v: string;

                constructor(v: string) {
                    this.v = v;
                }

                toString(): string {
                    return `S:${this.v}`;
                }
            }

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-implode-tostring-objects-are-plucked"
            // JS-only: any object with its own toString is exempt; @tolki/str is not a dependency
            expect(collect([new Label("a"), new Label("b")]).implode(",")).toBe(
                "S:a,S:b",
            );
        });

        it("plucks from Date items, as PHP plucks from DateTime ones, which have no __toString", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-implode-date-items-are-plucked"
            expect(collect([new Date(0), new Date(1)]).implode(", ")).toBe("");
        });

        it("converts non-string items to string", () => {
            // When items are numbers
            const c = collect([1, 2, 3]);
            expect(c.implode(", ")).toBe("1, 2, 3");
        });

        it("handles isArray check for plucking", () => {
            // When first item is an array
            const c = collect([
                [1, 2],
                [3, 4],
            ]);
            expect(c.implode(0, ", ")).toBe("1, 3");
        });

        it("handles plain objects for plucking", () => {
            // When first item is a plain object
            const c = collect([{ name: "John" }, { name: "Jane" }]);
            expect(c.implode("name", ", ")).toBe("John, Jane");
        });

        it("handles object-based collection in joinItems", () => {
            // Test with object-based collection to cover the Object.values branch in joinItems
            const c = collect({ a: "apple", b: "banana", c: "cherry" });
            expect(c.implode(", ")).toBe("apple, banana, cherry");
        });

        it("casts each piece as PHP's implode() does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-implode-scalar-casts"
            expect(collect([true, false, null, 1.0, 2.5, 0]).implode(",")).toBe(
                "1,,,1,2.5,0",
            );
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-implode-missing-key"
            expect(collect([{ a: 1 }, { b: 2 }]).implode("a", ",")).toBe("1,");
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-implode-callback-casts"
            expect(collect([1, 2]).implode((value) => value > 1, ",")).toBe(
                ",1",
            );
        });

        it("prints a float as PHP's (string) cast does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-implode-float-casts"
            expect(collect([0.1 + 0.2, 1.0, 1e25, -0.0]).implode(",")).toBe(
                "0.3,1,1.0E+25,-0",
            );
        });

        it("prints an array piece as Array, as PHP's (string) cast does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-implode-array-pieces"
            expect([
                collect([1, [2, 3]]).implode(","),
                collect(["a", { b: 1 }]).implode(","),
                collect([1, 2]).implode((value) => [value], ","),
                collect([{ a: [1] }, { a: 2 }]).implode("a", ","),
            ]).toEqual(["1,Array", "a,Array", "Array,Array", "Array,2"]);
            // JS-only: a Map stands in for an array, as a plain object does
            expect(collect(["a", new Map([["b", 1]])]).implode(",")).toBe(
                "a,Array",
            );
        });

        it("throws PHP's Error for an object piece without its own toString, or a closure", () => {
            class stdClass {}

            const failure = (type: string) =>
                new Error(
                    `Object of class ${type} could not be converted to string`,
                );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-implode-object-pieces": a JS Date
            // names its own class, where PHP's message names DateTime.
            expect(() => collect([1, new stdClass()]).implode(",")).toThrow(
                failure("stdClass"),
            );
            expect(() => collect([1, new Date(0)]).implode(",")).toThrow(
                failure("Date"),
            );
            expect(() => collect([1, () => 1]).implode(",")).toThrow(
                failure("Closure"),
            );
            expect(() =>
                collect([1, 2]).implode(() => new stdClass(), ","),
            ).toThrow(failure("stdClass"));
            expect(() =>
                collect([{ a: new stdClass() }]).implode("a", ","),
            ).toThrow(failure("stdClass"));
        });

        it("casts a piece with its own toString through it, and a collection through its JSON", () => {
            class Label {
                v: string;

                constructor(v: string) {
                    this.v = v;
                }

                toString(): string {
                    return `S:${this.v}`;
                }
            }

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-implode-object-pieces"
            expect([
                collect([1, new Label("T")]).implode(","),
                collect([1, collect([2])]).implode(","),
            ]).toEqual(["1,S:T", "1,[2]"]);
        });
    });

    describe("intersect", () => {
        describe("Laravel Tests", () => {
            it("test intersect null", () => {
                // CollectionTest::testIntersectNull
                const c = collect({ id: 1, first_word: "Hello" });
                expect(c.intersect(null).all()).toEqual({});

                const c2 = collect([1, "Hello"]);
                expect(c2.intersect(null).all()).toEqual([]);
            });

            it("test intersect collection", () => {
                // CollectionTest::testIntersectCollection, whose operand spells first_world, not first_word
                const c = collect({ id: 1, first_word: "Hello" });
                expect(
                    c
                        .intersect(
                            collect({
                                first_world: "Hello",
                                last_word: "World",
                            }),
                        )
                        .all(),
                ).toEqual({
                    first_word: "Hello",
                });
            });

            it("test intersect array-backed collection", () => {
                // There was no array-backed positive assertion for `intersect`, only
                // the null case above.
                expect(
                    collect([1, 2, 3, 4]).intersect([2, 4, 6]).all(),
                ).toEqual([2, 4]);
            });
        });

        // docs/php-parity/task-17-second-review.json, "intersect over array items collapses to \"Array\""
        // JS-only: PHP casts each array item to the string "Array" and keeps both; an object matches by identity here
        it('keeps object items that are identical, where PHP keeps both via its "Array" cast', () => {
            const shared = { id: 1 };
            expect(
                collect([shared, { id: 2 }])
                    .intersect([shared])
                    .all(),
            ).toEqual([shared]);
        });

        it.fails(
            "keeps a Map-built receiver's order for the items it keeps",
            () => {
                const result = outOfOrderKeys().intersect(["c", "b"]);

                // Ordered-backing gap: PHP keeps the items in the receiver's insertion order, key 2 before 1
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-receiver-out-of-order"
                expect([result.keys().all(), result.values().all()]).toEqual([
                    [2, 1],
                    ["c", "b"],
                ]);
            },
        );
    });

    describe("intersect operand handling", () => {
        it("agrees with Arr.intersect on identical object items", () => {
            // JS-only: an object item matches by identity, where PHP compares its "Array" cast
            const shared = { id: 1 };
            const collection = new Collection([shared, { id: 2 }])
                .intersect([shared])
                .all();
            expect(collection).toEqual(
                Arr.intersect([shared, { id: 2 }], [shared]),
            );
        });

        it("does not contradict diff about whether an item is present", () => {
            // JS-only: diff and intersect both match an object item by identity, where PHP compares its "Array" cast
            const shared = { id: 1 };
            const removedByDiff = new Collection([shared, { id: 2 }])
                .diff([shared])
                .all();
            const keptByIntersect = new Collection([shared, { id: 2 }])
                .intersect([shared])
                .all();
            expect(removedByDiff).toEqual([{ id: 2 }]);
            expect(keptByIntersect).toEqual([shared]);
        });

        it("normalizes an Arrayable operand the way diff does", () => {
            // A class instance, not an object literal: only a real Arrayable unwraps.
            class ArrayableOperand {
                toArray() {
                    return { b: 20 };
                }
            }

            const arrayable = new ArrayableOperand();
            expect(
                new Collection({ a: 10, b: 20 })
                    .intersect(arrayable as never)
                    .all(),
            ).toEqual({ b: 20 });
        });

        it("normalizes a Map operand the way diff does", () => {
            // JS-only: PHP has no Map; a Map operand stands in for the array it holds
            const map = new Map([["b", 20]]);
            expect(
                new Collection({ a: 10, b: 20 }).intersect(map as never).all(),
            ).toEqual({ b: 20 });
        });

        it("reads a plain object's all member as one of its values, never unwrapping it", () => {
            const operand = { all: () => ["b"] };
            const result = collect(["a", "b"]).intersect(operand);

            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-F-plain-object-all-member-is-data-by-value": PHP's all member casts to 'zzz', since array_intersect
            // cannot cast a Closure, and a function matches by identity here, so neither matches an item
            expect(result.all()).toEqual([]);
        });
    });

    describe("intersectUsing", () => {
        describe("Laravel Tests", () => {
            it("test intersect using with null", () => {
                // CollectionTest::testIntersectUsingWithNull
                const c = collect(["green", "brown", "blue"]);
                expect(c.intersectUsing(null, strcasecmp).all()).toEqual([]);

                const d = collect({ id: 1, first_word: "Hello" });
                expect(d.intersectUsing(null, strcasecmp).all()).toEqual({});
            });

            it("test intersect using collection", () => {
                // CollectionTest::testIntersectUsingCollection
                const c = collect(["green", "brown", "blue"]);
                expect(
                    c
                        .intersectUsing(
                            collect(["GREEN", "brown", "yellow"]),
                            strcasecmp,
                        )
                        .all(),
                ).toEqual(["green", "brown"]);
            });
        });

        it("reads a comparator's 0 as equal, as PHP's <=> answers", () => {
            const intersected = collect([1, 2, 3]).intersectUsing(
                [2, 3],
                (a, b) => Math.sign(a - b),
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-intersectUsing-spaceship-comparator"
            // PHP keeps the keys ({1: 2, 2: 3}); a list backing reindexes, as a JS array holds no sparse keys.
            expect(intersected.all()).toEqual([2, 3]);
            expect(intersected.keys().all()).toEqual([0, 1]);
            expect(intersected.values().all()).toEqual([2, 3]);
        });

        it("drops a fraction from a comparator's answer, as PHP's int cast does", () => {
            const intersected = (answer: number) =>
                collect([1, 2, 3])
                    .intersectUsing([2], () => answer)
                    .all();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-using-fractional-comparator"
            expect(intersected(0.5)).toEqual([1, 2, 3]);
            expect(intersected(-0.99)).toEqual([1, 2, 3]);
            expect(intersected(1.5)).toEqual([]);
        });

        it.fails(
            "keeps a Map-built receiver's order for the items it keeps",
            () => {
                const result = outOfOrderKeys().intersectUsing(
                    ["C", "B"],
                    strcasecmp,
                );

                // Ordered-backing gap: PHP keeps the items in the receiver's insertion order, key 2 before 1
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-receiver-out-of-order"
                expect([result.keys().all(), result.values().all()]).toEqual([
                    [2, 1],
                    ["c", "b"],
                ]);
            },
        );
    });

    describe("intersectUsing operand handling", () => {
        // JS-only: PHP has no Map; a Map operand stands in for the array it holds
        it("normalizes a Map operand the way diff and intersect do", () => {
            const map = new Map([["b", 20]]);
            expect(
                new Collection({ a: 10, b: 20 })
                    .intersectUsing(map as never, (a, b) => a === b)
                    .all(),
            ).toEqual({ b: 20 });
        });

        it("reads a plain object's all member as one of its values, never unwrapping it", () => {
            const operand = { all: () => ["b"] };
            const result = collect(["a", "b"]).intersectUsing(
                operand,
                (x, y) => (x === y ? 0 : 1),
            );

            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-F-plain-object-all-member-is-data-by-value"
            expect(result.all()).toEqual([]);
        });
    });

    describe("intersectAssoc", () => {
        describe("Laravel Tests", () => {
            it("test intersect assoc with null", () => {
                // CollectionTest::testIntersectAssocWithNull
                const array1 = collect({
                    a: "green",
                    b: "brown",
                    c: "blue",
                    0: "red",
                });

                expect(array1.intersectAssoc(null).all()).toEqual({});
            });

            it("test intersect assoc collection", () => {
                // CollectionTest::testIntersectAssocCollection
                const array1 = collect({
                    a: "green",
                    b: "brown",
                    c: "blue",
                    0: "red",
                });
                const array2 = collect({
                    a: "green",
                    b: "yellow",
                    0: "blue",
                    1: "red",
                });

                expect(array1.intersectAssoc(array2).all()).toEqual({
                    a: "green",
                });
            });
        });

        describe("test intersect assoc with arrays", () => {
            it("test intersect assoc array with null", () => {
                const array1 = collect(["green", "brown", "blue", "red"]);

                expect(array1.intersectAssoc(null).all()).toEqual([]);
            });

            it("test intersect assoc array collection", () => {
                const array1 = collect(["green", "brown", "blue", "red"]);
                const array2 = collect(["green", "yellow", "blue", "red"]);

                expect(array1.intersectAssoc(array2).all()).toEqual([
                    "green",
                    "blue",
                    "red",
                ]);
            });
        });

        it.fails(
            "keeps a Map-built receiver's order for the items it keeps",
            () => {
                const result = outOfOrderKeys().intersectAssoc({
                    2: "c",
                    1: "b",
                });

                // Ordered-backing gap: PHP keeps the items in the receiver's insertion order, key 2 before 1
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-receiver-out-of-order"
                expect([result.keys().all(), result.values().all()]).toEqual([
                    [2, 1],
                    ["c", "b"],
                ]);
            },
        );
    });

    describe("intersectAssoc operand handling", () => {
        it("keeps an identical object value under a matching key, like intersect does", () => {
            // JS-only: an object value matches by identity, where PHP compares its "Array" cast
            const shared = { id: 1 };
            expect(
                new Collection({ a: shared })
                    .intersectAssoc({ a: shared })
                    .all(),
            ).toEqual({ a: shared });
        });

        // JS-only: PHP has no Map; a Map operand stands in for the array it holds
        it("normalizes a Map operand the way diff and intersect do", () => {
            const map = new Map([["b", 20]]);
            expect(
                new Collection({ a: 10, b: 20 })
                    .intersectAssoc(map as never)
                    .all(),
            ).toEqual({ b: 20 });
        });

        // docs/php-parity/task-17-second-review.json, "array_intersect_assoc casts values to string"
        it("matches values by PHP's string cast", () => {
            expect(
                new Collection({ a: 0 })
                    .intersectAssoc({ a: "0" } as never)
                    .all(),
            ).toEqual({ a: 0 });
        });

        it("reads a Collection operand's items", () => {
            // CollectionTest::testIntersectAssocCollection
            // docs/php-parity/task-23-obj-release-readiness.json, "intersectAssoc-collection"
            const result = collect({
                a: "green",
                b: "brown",
                c: "blue",
                0: "red",
            }).intersectAssoc(
                collect({ a: "green", b: "yellow", 0: "blue", 1: "red" }),
            );

            expect(result.all()).toEqual({ a: "green" });
            expect(result.keys().all()).toEqual(["a"]);
            expect(result.values().all()).toEqual(["green"]);
        });

        it("takes an operand of the other shape, on either backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "object-backing-list-operand", "intersectAssoc-list-keyed-operand"
            expect(
                collect({ 0: "a", 1: "b", x: "c" }).intersectAssoc(["a"]).all(),
            ).toEqual({ 0: "a" });
            expect(
                collect(["a", "b"]).intersectAssoc({ 1: "b" }).all(),
            ).toEqual(["b"]);
        });

        it("reads a plain object's all member as one of its entries, never unwrapping it", () => {
            const operand = { all: () => ({ b: 2 }) };
            const result = collect({ a: 1, b: 2 }).intersectAssoc(
                operand as never,
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-plain-object-all-member-is-data-by-key"
            expect(result.all()).toEqual({});
            expect(result.keys().all()).toEqual([]);
            expect(result.values().all()).toEqual([]);
        });
    });

    describe("intersectAssocUsing", () => {
        describe("Laravel Tests", () => {
            it("test intersect assoc using with null", () => {
                // CollectionTest::testIntersectAssocUsingWithNull
                const array1 = collect({
                    a: "green",
                    b: "brown",
                    c: "blue",
                    0: "red",
                });

                expect(
                    array1.intersectAssocUsing(null, strcasecmp).all(),
                ).toEqual({});
            });

            it("test intersect assoc using collection", () => {
                // CollectionTest::testIntersectAssocUsingCollection
                const array1 = collect({
                    a: "green",
                    b: "brown",
                    c: "blue",
                    0: "red",
                });
                const array2 = collect({
                    a: "GREEN",
                    B: "brown",
                    0: "yellow",
                    1: "red",
                });

                expect(
                    array1.intersectAssocUsing(array2, strcasecmp).all(),
                ).toEqual({ b: "brown" });
            });
        });

        describe("test intersect assoc using with arrays", () => {
            it("test intersect assoc using with arrays with null", () => {
                const array1 = collect(["green", "brown", "blue", "red"]);

                expect(
                    array1.intersectAssocUsing(null, strcasecmp).all(),
                ).toEqual([]);
            });

            it("test intersect assoc using with arrays collection", () => {
                const array1 = collect(["green", "brown", "blue", "red"]);
                const array2 = collect(["GREEN", "brown", "yellow", "red"]);

                expect(
                    array1.intersectAssocUsing(array2, strcasecmp).all(),
                ).toEqual(["brown", "red"]);
            });
        });

        it.fails(
            "keeps a Map-built receiver's order for the items it keeps",
            () => {
                const result = outOfOrderKeys().intersectAssocUsing(
                    { 2: "c", 1: "b" },
                    strcasecmp,
                );

                // Ordered-backing gap: PHP keeps the items in the receiver's insertion order, key 2 before 1
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-receiver-out-of-order"
                expect([result.keys().all(), result.values().all()]).toEqual([
                    [2, 1],
                    ["c", "b"],
                ]);
            },
        );
    });

    describe("intersectAssocUsing operand handling", () => {
        it("keeps an identical object value when the key callback matches", () => {
            // JS-only: an object value matches by identity, where PHP compares its "Array" cast
            const shared = { id: 1 };
            expect(
                new Collection({ a: shared })
                    .intersectAssocUsing({ A: shared }, strcasecmp)
                    .all(),
            ).toEqual({ a: shared });
        });

        // JS-only: PHP has no Map; a Map operand stands in for the array it holds
        it("normalizes a Map operand the way diff and intersect do", () => {
            const map = new Map([
                ["A", "green"],
                ["B", "yellow"],
            ]);
            expect(
                new Collection({ a: "green", b: "brown" })
                    .intersectAssocUsing(map as never, strcasecmp)
                    .all(),
            ).toEqual({ a: "green" });
        });

        // docs/php-parity/task-17-second-review.json, "array_intersect_assoc casts values to string"
        it("matches values by PHP's string cast, like intersectAssoc", () => {
            expect(
                new Collection({ a: 0 })
                    .intersectAssocUsing({ a: "0" } as never, (x, y) => x === y)
                    .all(),
            ).toEqual({ a: 0 });
        });

        it("reads a Collection operand's items", () => {
            // CollectionTest::testIntersectAssocUsingCollection
            // docs/php-parity/task-23-obj-release-readiness.json, "C9 intersectAssocUsing strcasecmp"
            const result = collect({
                a: "green",
                b: "brown",
                c: "blue",
                0: "red",
            }).intersectAssocUsing(
                collect({ a: "GREEN", B: "brown", 0: "yellow", 1: "red" }),
                strcasecmp,
            );

            expect(result.all()).toEqual({ b: "brown" });
            expect(result.keys().all()).toEqual(["b"]);
            expect(result.values().all()).toEqual(["brown"]);
        });

        it("takes an operand of the other shape, on either backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "object-backing-list-operand", "intersectAssocUsing-list-keyed-operand"
            expect(
                collect({ 0: "a", 1: "b", x: "c" })
                    .intersectAssocUsing(["a"], (a, b) => a === b)
                    .all(),
            ).toEqual({ 0: "a" });
            expect(
                collect(["a", "b"])
                    .intersectAssocUsing({ 1: "b" }, (a, b) => a === b)
                    .all(),
            ).toEqual(["b"]);
        });

        it("reads a plain object's all member as one of its entries, never unwrapping it", () => {
            const operand = { all: () => ({ b: 2 }) };
            const result = collect({ a: 1, b: 2 }).intersectAssocUsing(
                operand as never,
                strcasecmp,
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-plain-object-all-member-is-data-by-key"
            expect(result.all()).toEqual({});
            expect(result.keys().all()).toEqual([]);
            expect(result.values().all()).toEqual([]);
        });
    });

    describe("intersectByKeys", () => {
        describe("Laravel Tests", () => {
            it("test intersect by keys null", () => {
                // CollectionTest::testIntersectByKeysNull
                const c = collect({ name: "Mateus", age: 18 });
                expect(c.intersectByKeys(null).all()).toEqual({});

                const d = collect(["Mateus", 18]);
                expect(d.intersectByKeys(null).all()).toEqual([]);
            });

            it("test intersect by keys", () => {
                // CollectionTest::testIntersectByKeys
                const c = collect({ name: "Mateus", age: 18 });
                expect(
                    c
                        .intersectByKeys(
                            collect({ name: "Mateus", surname: "Guimaraes" }),
                        )
                        .all(),
                ).toEqual({ name: "Mateus" });
            });

            it("test intersect by keys with different values", () => {
                // CollectionTest::testIntersectByKeys
                const c = collect({
                    name: "taylor",
                    family: "otwell",
                    age: 26,
                });
                expect(
                    c
                        .intersectByKeys(
                            collect({
                                height: 180,
                                name: "amir",
                                family: "moharami",
                            }),
                        )
                        .all(),
                ).toEqual({ name: "taylor", family: "otwell" });
            });
        });

        it.fails(
            "keeps a Map-built receiver's order for the items it keeps",
            () => {
                const result = outOfOrderKeys().intersectByKeys({
                    2: "x",
                    1: "y",
                });

                // Ordered-backing gap: PHP keeps the items in the receiver's insertion order, key 2 before 1
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-receiver-out-of-order"
                expect([result.keys().all(), result.values().all()]).toEqual([
                    [2, 1],
                    ["c", "b"],
                ]);
            },
        );
    });

    describe("intersectByKeys operand handling", () => {
        // JS-only: PHP has no Map; a Map operand stands in for the array it holds
        it("normalizes a Map operand the way diff and intersect do", () => {
            const map = new Map([["b", 999]]);
            expect(
                new Collection({ a: 1, b: 2 })
                    .intersectByKeys(map as never)
                    .all(),
            ).toEqual({ b: 2 });
        });

        it("reads a Collection operand's items", () => {
            // CollectionTest::testIntersectByKeys
            // docs/php-parity/task-23-obj-release-readiness.json, "C19 intersectByKeys 2"
            const result = collect({
                name: "taylor",
                family: "otwell",
                age: 26,
            }).intersectByKeys(
                collect({ height: 180, name: "amir", family: "moharami" }),
            );

            expect(result.all()).toEqual({ name: "taylor", family: "otwell" });
            expect(result.keys().all()).toEqual(["name", "family"]);
            expect(result.values().all()).toEqual(["taylor", "otwell"]);
        });

        it("takes an operand of the other shape, on either backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "object-backing-list-operand", "intersectByKeys-list-keyed-operand"
            expect(
                collect({ 0: "a", 1: "b", x: "c" })
                    .intersectByKeys(["z"])
                    .all(),
            ).toEqual({ 0: "a" });
            expect(
                collect([1, 2, 3]).intersectByKeys({ 0: "x", 2: "y" }).all(),
            ).toEqual([1, 3]);
        });

        it("reads a plain object's all member as one of its keys, never unwrapping it", () => {
            const operand = { all: () => ({ b: 2 }) };
            const result = collect({ all: 1, b: 2 }).intersectByKeys(
                operand as never,
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-plain-object-all-member-is-data"
            expect(result.all()).toEqual({ all: 1 });
            expect(result.keys().all()).toEqual(["all"]);
            expect(result.values().all()).toEqual([1]);
        });
    });

    describe("isEmpty", () => {
        describe("Laravel Tests", () => {
            it("answers for an empty collection and a filled one", () => {
                // CollectionTest::testEmptyCollectionIsEmpty
                // CollectionTest::testEmptyCollectionIsNotEmpty
                const data = collect();

                expect(data.isEmpty()).toBe(true);
                expect(data.isNotEmpty()).toBe(false);

                const data2 = collect([1]);

                expect(data2.isEmpty()).toBe(false);
                expect(data2.isNotEmpty()).toBe(true);
            });
        });

        it("returns true for empty array collection", () => {
            const collection = collect([]);
            expect(collection.isEmpty()).toBe(true);
        });

        it("returns true for empty object collection", () => {
            const collection = collect({});
            expect(collection.isEmpty()).toBe(true);
        });

        it("returns false for non-empty array collection", () => {
            const collection = collect([1, 2, 3]);
            expect(collection.isEmpty()).toBe(false);
        });

        it("returns false for non-empty object collection", () => {
            const collection = collect({ a: 1 });
            expect(collection.isEmpty()).toBe(false);
        });

        it("counts a null item as an item", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-isEmpty-null-item"
            expect(collect([null]).isEmpty()).toBe(false);
        });

        it("agrees with count() after a keyed write onto an empty list", () => {
            const collection = collect([]).put("x", 1);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-isEmpty-after-put-on-empty-list"
            expect(collection.isEmpty()).toBe(false);
            expect(collection.count()).toBe(1);
        });

        it("agrees with count() on a list with a hole", () => {
            const holes: number[] = [];
            holes.length = 1;
            const collection = new Collection(holes);

            // JS-only: PHP has no sparse array; a hole holds no item, so neither view counts one.
            expect(collection.isEmpty()).toBe(true);
            expect(collection.count()).toBe(0);
        });

        it("agrees with count() on a list whose item follows a hole", () => {
            const holes: string[] = [];
            holes[1] = "b";
            const collection = new Collection(holes);

            // JS-only: PHP has no sparse array; the hole holds no item, but the index after it does.
            expect(collection.isEmpty()).toBe(false);
            expect(collection.isNotEmpty()).toBe(true);
            expect(collection.count()).toBe(1);
        });

        it("reads a list only up to its first item", () => {
            const read = new Set<string>();
            const list = new Proxy(
                Array.from({ length: 1000 }, (_, index) => index),
                {
                    has(target, key) {
                        read.add(String(key));

                        return Reflect.has(target, key);
                    },
                    getOwnPropertyDescriptor(target, key) {
                        read.add(String(key));

                        return Reflect.getOwnPropertyDescriptor(target, key);
                    },
                },
            );

            class Watched extends Collection<number, number> {
                constructor() {
                    super([]);
                    this.items = list;
                }
            }

            // JS-only: a bound on the work, so a loop that asks isEmpty() before each shift() stays linear.
            expect(new Watched().isEmpty()).toBe(false);
            expect([...read].filter((key) => /^\d+$/.test(key))).toEqual(["0"]);
        });
    });

    describe("containsOneItem", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testContainsOneItem
            expect(collect([]).containsOneItem()).toBe(false);
            expect(collect([1]).containsOneItem()).toBe(true);
            expect(collect([1, 2]).containsOneItem()).toBe(false);

            expect(collect({}).containsOneItem()).toBe(false);
            expect(collect({ a: 1 }).containsOneItem()).toBe(true);
            expect(collect({ a: 1, b: 2 }).containsOneItem()).toBe(false);

            expect(
                collect([1, 2, 2]).containsOneItem((number) => number === 2),
            ).toBe(false);
            expect(
                collect(["ant", "bear", "cat"]).containsOneItem(
                    (word) => word.length === 4,
                ),
            ).toBe(true);
            expect(
                collect(["ant", "bear", "cat"]).containsOneItem(
                    (word) => word.length > 4,
                ),
            ).toBe(false);

            expect(
                collect({ a: 1, b: 2, c: 2 }).containsOneItem(
                    (number) => number === 2,
                ),
            ).toBe(false);
            expect(
                collect({ a: "ant", b: "bear", c: "cat" }).containsOneItem(
                    (word) => word.length === 4,
                ),
            ).toBe(true);
            expect(
                collect({ a: "ant", b: "bear", c: "cat" }).containsOneItem(
                    (word) => word.length > 4,
                ),
            ).toBe(false);
        });
    });

    describe("containsManyItems", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testContainsManyItems
            expect(collect([]).containsManyItems()).toBe(false);
            expect(collect([1]).containsManyItems()).toBe(false);
            expect(collect([1, 2]).containsManyItems()).toBe(true);
            expect(collect([1, 2, 3]).containsManyItems()).toBe(true);

            expect(
                collect([1, 2, 2]).containsManyItems((number) => number === 2),
            ).toBe(true);
            expect(
                collect(["ant", "bear", "cat"]).containsManyItems(
                    (word) => word.length === 4,
                ),
            ).toBe(false);
            expect(
                collect(["ant", "bear", "cat"]).containsManyItems(
                    (word) => word.length > 4,
                ),
            ).toBe(false);
            expect(
                collect(["ant", "bear", "cat"]).containsManyItems(
                    (word) => word.length === 3,
                ),
            ).toBe(true);
        });

        it("test with objects", () => {
            // CollectionTest::testContainsManyItems, over a record
            expect(collect({}).containsManyItems()).toBe(false);
            expect(collect({ a: 1 }).containsManyItems()).toBe(false);
            expect(collect({ a: 1, b: 2 }).containsManyItems()).toBe(true);
            expect(collect({ a: 1, b: 2, c: 3 }).containsManyItems()).toBe(
                true,
            );

            expect(
                collect({ a: 1, b: 2, c: 2 }).containsManyItems(
                    (number) => number === 2,
                ),
            ).toBe(true);
            expect(
                collect({ a: "ant", b: "bear", c: "cat" }).containsManyItems(
                    (word) => word.length === 4,
                ),
            ).toBe(false);
            expect(
                collect({ a: "ant", b: "bear", c: "cat" }).containsManyItems(
                    (word) => word.length > 4,
                ),
            ).toBe(false);
            expect(
                collect({ a: "ant", b: "bear", c: "cat" }).containsManyItems(
                    (word) => word.length === 3,
                ),
            ).toBe(true);
        });
    });

    describe("hasSole", () => {
        it("Laravel tests", () => {
            // CollectionTest::testHasSole
            const collection = collect([{ age: 2 }, { age: 3 }]);

            expect(collection.hasSole()).toBe(false);
            expect(collection.where("age", 1).hasSole()).toBe(false);
            expect(collection.where("age", 2).hasSole()).toBe(true);

            expect(collection.hasSole(() => true)).toBe(false);
            expect(collection.hasSole(() => false)).toBe(false);
            expect(collection.hasSole((item) => item.age === 2)).toBe(true);

            expect(collection.hasSole("age", ">", 1)).toBe(false);
            expect(collection.hasSole("age", "<", 1)).toBe(false);
            expect(collection.hasSole("age", 2)).toBe(true);
        });

        it("test hasSole with empty collection", () => {
            expect(collect([]).hasSole()).toBe(false);
            expect(collect({}).hasSole()).toBe(false);
        });

        it("test hasSole with single item", () => {
            expect(collect([1]).hasSole()).toBe(true);
            expect(collect({ a: 1 }).hasSole()).toBe(true);
        });

        it("test hasSole with callback on objects", () => {
            const collection = collect({ a: { age: 2 }, b: { age: 3 } });

            expect(collection.hasSole()).toBe(false);
            expect(collection.hasSole((item) => item.age === 2)).toBe(true);
            expect(collection.hasSole((item) => item.age > 1)).toBe(false);
        });

        it("returns true with null filter on single item", () => {
            const c = collect([42]);
            expect(c.hasSole()).toBe(true);
        });

        it("uses callback filter", () => {
            const c = collect([1, 2, 3, 4, 5]);
            // Only one item > 4
            expect(c.hasSole((v) => v > 4)).toBe(true);
        });

        it("uses operatorForWhere when key is not callable", () => {
            const c = collect([{ status: "active" }, { status: "inactive" }]);
            expect(c.hasSole("status", "=", "active")).toBe(true);
        });

        it("reads a null second argument as the value the key must equal", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-two-args-null-value"
            expect(collect([{ a: null }, { a: 1 }]).hasSole("a", null)).toBe(
                true,
            );
        });

        it("reads an explicit undefined second argument as PHP's null", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-two-args-null-value":
            // PHP's answer for a null second argument. JS-only: an explicit undefined stands for that null
            expect(
                collect([{ a: null }, { a: 1 }]).hasSole("a", undefined),
            ).toBe(true);
        });

        it("counts a falsy item when no filter is given", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-hasSole-hasMany-keep-falsy-items"
            expect([collect([0]).hasSole(), collect([null]).hasSole()]).toEqual(
                [true, true],
            );
        });

        it.fails(
            "filters a Map-built collection in its insertion order",
            () => {
                const seen: number[] = [];
                outOfOrderKeys().hasSole((_value, key) => {
                    seen.push(key);

                    return false;
                });

                // Ordered-backing gap: PHP filters in insertion order, key 2 before 0 and 1
                // docs/php-parity/task-32-collection-release-readiness.json,
                // "C32-C-filtered-predicates-out-of-order-visits"
                expect(seen).toEqual([2, 0, 1]);
            },
        );

        it("throws TypeError for a lone key it cannot call, as PHP's filter() does", () => {
            const collection = collect([{ name: "foo" }]);
            const hasSole = (key: unknown) => () =>
                Reflect.apply(collection.hasSole, collection, [key]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-string-key-one-arg-forms-throw" and
            // "C32-C-lone-key-type-error-message", whose class the port names without PHP's namespace
            expect(hasSole("name")).toThrowError(
                expect.objectContaining({
                    name: "TypeError",
                    message:
                        "Collection::filter(): Argument #1 ($callback) must be of type ?callable, string given",
                }),
            );
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-lone-key-forms-by-key-class"
            expect(hasSole("0")).toThrowError(TypeError);
            expect(hasSole(1)).toThrowError(TypeError);
        });

        it("counts every item for a lone key PHP compares equal to null", () => {
            const collection = collect([{ name: "foo" }]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-lone-key-forms-by-key-class"
            expect([
                Reflect.apply(collection.hasSole, collection, [0]),
                Reflect.apply(collection.hasSole, collection, [""]),
            ]).toEqual([true, true]);
        });
    });

    describe("hasMany", () => {
        it("Laravel tests", () => {
            // CollectionTest::testHasMany
            const collection = collect([{ age: 2 }, { age: 3 }]);

            expect(collection.hasMany()).toBe(true);
            expect(collection.where("age", 1).hasMany()).toBe(false);
            expect(collection.where("age", 2).hasMany()).toBe(false);

            expect(collection.hasMany(() => true)).toBe(true);
            expect(collection.hasMany(() => false)).toBe(false);
            expect(collection.hasMany((item) => item.age === 2)).toBe(false);

            expect(collection.hasMany("age", ">", 1)).toBe(true);
            expect(collection.hasMany("age", "<", 1)).toBe(false);
            expect(collection.hasMany("age", 2)).toBe(false);
        });

        it("test hasMany with empty collection", () => {
            expect(collect([]).hasMany()).toBe(false);
            expect(collect({}).hasMany()).toBe(false);
        });

        it("test hasMany with single item", () => {
            expect(collect([1]).hasMany()).toBe(false);
            expect(collect({ a: 1 }).hasMany()).toBe(false);
        });

        it("test hasMany with callback on objects", () => {
            const collection = collect({ a: { age: 2 }, b: { age: 3 } });

            expect(collection.hasMany()).toBe(true);
            expect(collection.hasMany((item) => item.age === 2)).toBe(false);
            expect(collection.hasMany((item) => item.age > 1)).toBe(true);
        });

        it("test hasMany with multiple items matching", () => {
            expect(collect([1, 2, 2]).hasMany((n) => n === 2)).toBe(true);
            expect(
                collect(["ant", "bear", "cat"]).hasMany(
                    (word) => word.length === 3,
                ),
            ).toBe(true);
        });

        it("uses callback filter", () => {
            const c = collect([1, 2, 3, 4, 5]);
            // Use callback to check if collection has more than one even number
            expect(c.hasMany((v) => v % 2 === 0)).toBe(true);
        });

        it("uses operatorForWhere when key is not callable", () => {
            const c = collect([
                { status: "active" },
                { status: "active" },
                { status: "inactive" },
            ]);
            expect(c.hasMany("status", "=", "active")).toBe(true);
        });

        it("reads a null second argument as the value the key must equal", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-two-args-null-value"
            expect(
                collect([{ a: null }, { a: 0 }, { a: 1 }]).hasMany("a", null),
            ).toBe(true);
        });

        it("reads an explicit undefined second argument as PHP's null", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-two-args-null-value":
            // PHP's answer for a null second argument. JS-only: an explicit undefined stands for that null
            expect(
                collect([{ a: null }, { a: 0 }, { a: 1 }]).hasMany(
                    "a",
                    undefined,
                ),
            ).toBe(true);
        });

        it("counts falsy items when no filter is given", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-hasSole-hasMany-keep-falsy-items"
            expect(collect([0, null]).hasMany()).toBe(true);
        });

        it.fails(
            "filters a Map-built collection in its insertion order",
            () => {
                const seen: number[] = [];
                outOfOrderKeys().hasMany((_value, key) => {
                    seen.push(key);

                    return false;
                });

                // Ordered-backing gap: PHP filters in insertion order, key 2 before 0 and 1
                // docs/php-parity/task-32-collection-release-readiness.json,
                // "C32-C-filtered-predicates-out-of-order-visits"
                expect(seen).toEqual([2, 0, 1]);
            },
        );

        it("throws TypeError for a lone key it cannot call, as PHP's filter() does", () => {
            const collection = collect([{ name: "foo" }, { name: "bar" }]);
            const hasMany = (key: unknown) => () =>
                Reflect.apply(collection.hasMany, collection, [key]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-string-key-one-arg-forms-throw" and
            // "C32-C-lone-key-type-error-message", whose class the port names without PHP's namespace
            expect(hasMany("name")).toThrowError(
                expect.objectContaining({
                    name: "TypeError",
                    message:
                        "Collection::filter(): Argument #1 ($callback) must be of type ?callable, string given",
                }),
            );
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-lone-key-forms-by-key-class"
            expect(hasMany("0")).toThrowError(TypeError);
            expect(hasMany(1)).toThrowError(TypeError);
        });

        it("counts every item for a lone key PHP compares equal to null", () => {
            const collection = collect([{ name: "foo" }, { name: "bar" }]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-lone-key-forms-by-key-class"
            expect([
                Reflect.apply(collection.hasMany, collection, [0]),
                Reflect.apply(collection.hasMany, collection, [""]),
            ]).toEqual([true, true]);
        });
    });

    describe("join", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testJoin
            expect(collect(["a", "b", "c"]).join(", ")).toBe("a, b, c");
            expect(collect(["a", "b", "c"]).join(", ", " and ")).toBe(
                "a, b and c",
            );
            expect(collect(["a", "b"]).join(", ", " and ")).toBe("a and b");
            expect(collect(["a"]).join(", ", " and ")).toBe("a");
            expect(collect([]).join(", ", " and ")).toBe("");
        });

        it("hands a lone item back as it is, an object without its own toString included", () => {
            class Point {}
            const point = new Point();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-join-lone-object-item"
            expect(collect([point]).join(", ", " and ")).toBe(point);
        });

        it("casts its last item as PHP's . does, and the rest as implode() does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-join-null-last-item" and
            // "C32-H-join-bool-items"
            expect([
                collect(["a", null]).join(", ", " and "),
                collect([true, false, true]).join(", ", " and "),
            ]).toEqual(["a and ", "1,  and 1"]);
        });

        it("prints a float as PHP's (string) cast does, the last item too", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-join-float-casts"
            expect(
                collect([0.1 + 0.2, 1.0, 1e25, -0.0]).join(", ", " and "),
            ).toBe("0.3, 1, 1.0E+25 and -0");
        });

        it("prints an array piece as Array and throws for an object piece, the last item too", () => {
            class stdClass {}

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-join-array-and-object-pieces"
            expect([
                collect([1, [2]]).join(", ", " and "),
                collect([1, [2], 3]).join(", ", " and "),
            ]).toEqual(["1 and Array", "1, Array and 3"]);
            expect(() =>
                collect([1, new stdClass()]).join(", ", " and "),
            ).toThrow(
                new Error(
                    "Object of class stdClass could not be converted to string",
                ),
            );
        });
    });

    describe("keys", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testKeys
            const c = collect({ name: "taylor", framework: "laravel" });
            expect(c.keys().all()).toEqual(["name", "framework"]);

            const c2 = collect(["taylor", "laravel"]);
            expect(c2.keys().all()).toEqual([0, 1]);
        });

        it("returns collection of object keys", () => {
            const collection = collect({ a: 1, b: 2, c: 3 });
            expect(collection.keys().all()).toEqual(["a", "b", "c"]);
        });

        it("returns collection of numeric keys for array", () => {
            const collection = collect([1, 2, 3]);
            expect(collection.keys().all()).toEqual([0, 1, 2]);
        });

        it("reports the same number of keys as values, even with a non-enumerable own property", () => {
            // JS-only: PHP's array has no entry it hides from iteration
            const items = Object.defineProperty({ a: 1 }, "hidden", {
                value: 2,
                enumerable: false,
            });
            const collection = collect(items);
            expect(collection.keys().count()).toBe(collection.values().count());
        });
    });

    describe("last", () => {
        describe("Laravel Tests", () => {
            it("test last returns last item in collection", () => {
                // CollectionTest::testLastReturnsLastItemInCollection
                const c = collect(["foo", "bar"]);
                expect(c.last()).toBe("bar");

                const c2 = collect([]);
                expect(c2.last()).toBeNull();
            });

            it("test last with callback", () => {
                // CollectionTest::testLastWithCallback
                const c = collect([100, 200, 300]);
                expect(c.last((value) => value < 250)).toBe(200);

                expect(c.last((_value, key) => key < 2)).toBe(200);

                expect(c.last((value) => value > 300)).toBeNull();
            });

            it("test last with callback and default", () => {
                // CollectionTest::testLastWithCallbackAndDefault
                const c = collect(["foo", "bar"]);
                expect(c.last((value) => value === "baz", "default")).toBe(
                    "default",
                );

                const c2 = collect(["foo", "bar", "Bar"]);
                expect(c2.last((value) => value === "bar", "default")).toBe(
                    "bar",
                );
            });

            it("test last with default and without callback", () => {
                // CollectionTest::testLastWithDefaultAndWithoutCallback
                const c = collect();
                expect(c.last(null, "default")).toBe("default");
            });
        });

        it("returns last array item", () => {
            const collection = collect([1, 2, 3]);
            expect(collection.last()).toBe(3);
        });

        it("returns last object item", () => {
            const collection = collect({ a: 1, b: 2, c: 3 });
            expect(collection.last()).toBe(3);
        });

        it("returns last array item matching callback", () => {
            const collection = collect([1, 2, 3, 4]);
            expect(collection.last((x) => x < 4)).toBe(3);
        });

        it("returns last object item matching callback", () => {
            const collection = collect({ a: 1, b: 2, c: 3, d: 4 });
            expect(collection.last((value) => value < 4)).toBe(3);
        });

        it("returns default when empty array", () => {
            const collection = collect([]);
            expect(collection.last(null, "default")).toBe("default");
        });

        it("returns default when empty object", () => {
            const collection = collect({});
            expect(collection.last(null, "default")).toBe("default");
        });

        it("returns null for an empty collection", () => {
            // CollectionTest::testLastReturnsLastItemInCollection
            const c = collect([]);
            expect(c.last()).toBeNull();
        });

        it("returns a stored undefined as stored, as first() does", () => {
            // JS-only: PHP has no undefined, so an item holding one comes back unchanged, from either end
            expect(collect([1, undefined]).last()).toBeUndefined();
            expect(collect({ a: 1, b: undefined }).last()).toBeUndefined();
            expect(
                collect([undefined, 1]).last(
                    (value) => value === undefined,
                    "default",
                ),
            ).toBeUndefined();
            expect(collect([undefined, 1]).first()).toBeUndefined();
        });
    });

    describe("pluck", () => {
        describe("Laravel Tests", () => {
            it("test pluck with array and object values", () => {
                // CollectionTest::testPluckWithArrayAndObjectValues
                const data = collect([
                    { name: "taylor", email: "foo" },
                    { name: "dayle", email: "bar" },
                ]);

                expect(data.pluck("email", "name").all()).toEqual({
                    taylor: "foo",
                    dayle: "bar",
                });
                expect(data.pluck("email").all()).toEqual(["foo", "bar"]);
            });

            it("test pluck with array access values", () => {
                // CollectionTest::testPluckWithArrayAccessValues
                class TestArrayAccessImplementation {
                    readonly #items: Record<string, unknown>;

                    constructor(items: Record<string, unknown>) {
                        this.#items = items;
                    }

                    offsetExists(offset: string): boolean {
                        return Object.hasOwn(this.#items, offset);
                    }

                    offsetGet(offset: string): unknown {
                        return this.#items[offset];
                    }
                }

                const data = collect([
                    new TestArrayAccessImplementation({
                        name: "taylor",
                        email: "foo",
                    }),
                    new TestArrayAccessImplementation({
                        name: "dayle",
                        email: "bar",
                    }),
                ]);

                expect(data.pluck("email", "name").all()).toEqual({
                    taylor: "foo",
                    dayle: "bar",
                });
                expect(data.pluck("email").all()).toEqual(["foo", "bar"]);
            });

            it("test pluck with dot notation", () => {
                // CollectionTest::testPluckWithDotNotation
                const data = collect([
                    {
                        name: "amir",
                        skill: {
                            backend: ["php", "python"],
                        },
                    },
                    {
                        name: "taylor",
                        skill: {
                            backend: ["php", "asp", "java"],
                        },
                    },
                ]);

                expect(data.pluck("skill.backend").all()).toEqual([
                    ["php", "python"],
                    ["php", "asp", "java"],
                ]);
            });

            it("test pluck with closure", () => {
                // CollectionTest::testPluckWithClosure
                const data = collect([
                    {
                        name: "amir",
                        skill: {
                            backend: ["php", "python"],
                        },
                    },
                    {
                        name: "taylor",
                        skill: {
                            backend: ["php", "asp", "java"],
                        },
                    },
                ]);

                expect(
                    data.pluck((row) => `${row.name} (verified)`).all(),
                ).toEqual(["amir (verified)", "taylor (verified)"]);

                expect(
                    data
                        .pluck("name", (row) => row.skill.backend.join("/"))
                        .all(),
                ).toEqual({
                    "php/python": "amir",
                    "php/asp/java": "taylor",
                });
            });

            it("test pluck duplicate keys exist", () => {
                // CollectionTest::testPluckDuplicateKeysExist
                const data = collect([
                    { brand: "Tesla", color: "red" },
                    { brand: "Pagani", color: "white" },
                    { brand: "Tesla", color: "black" },
                    { brand: "Pagani", color: "orange" },
                ]);

                expect(data.pluck("color", "brand").all()).toEqual({
                    Tesla: "black",
                    Pagani: "orange",
                });
            });

            it.fails("test get pluck value with accessors", () => {
                // CollectionTest::testGetPluckValueWithAccessors, a class getter standing in for its __get accessor
                class TestAccessorEloquentTestStub {
                    readonly #attributes: Record<string, unknown>;

                    constructor(attributes: Record<string, unknown>) {
                        this.#attributes = attributes;
                    }

                    get some(): unknown {
                        return this.#attributes["some"];
                    }
                }

                const data = collect([
                    new TestAccessorEloquentTestStub({ some: "foo" }),
                    new TestAccessorEloquentTestStub({ some: "bar" }),
                ]);

                // Deferred: pluck() reads no class getter, the port's stand-in for PHP's __get accessor
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-pluck-accessor"
                expect(data.pluck("some").all()).toEqual(["foo", "bar"]);
            });
        });

        it("plucks array values by key", () => {
            const collection = collect([
                { id: 1, name: "John" },
                { id: 2, name: "Jane" },
            ]);
            const names = collection.pluck("name");
            expect(names.all()).toEqual(["John", "Jane"]);
        });

        it("plucks object values by key", () => {
            const collection = collect({
                a: { id: 1, name: "John" },
                b: { id: 2, name: "Jane" },
            });
            const names = collection.pluck("name");
            expect(names.all()).toEqual(["John", "Jane"]);
            const idedNames = collection.pluck("name", "id");
            expect(idedNames.all()).toEqual({ 1: "John", 2: "Jane" });
        });

        it("hands both callbacks each item in the collection's order, the value one first", () => {
            const seen: string[] = [];
            const rows = new Collection(
                new Map([
                    [2, { n: "c", k: "kc" }],
                    [0, { n: "a", k: "ka" }],
                    [1, { n: "b", k: "kb" }],
                ]),
            );

            const result = rows.pluck(
                (item) => {
                    seen.push(`v:${item.n}`);

                    return item.n;
                },
                (item) => {
                    seen.push(`k:${item.n}`);

                    return item.k;
                },
            );

            // docs/php-parity/task-30-map-order.json, "pluck-out-of-order-callback-order"
            expect(seen).toEqual(["v:c", "k:c", "v:a", "k:a", "v:b", "k:b"]);
            // docs/php-parity/task-30-map-order.json, "pluck-out-of-order-keyed"
            expect(result.all()).toEqual({ kc: "c", ka: "a", kb: "b" });
            expect(result.keys().all()).toEqual(["kc", "ka", "kb"]);
            expect(result.values().all()).toEqual(["c", "a", "b"]);
        });

        it("plucks wildcard paths the same way for array and object backing", () => {
            // dataPluck routes object input to Obj.pluck and array input to Arr.pluck,
            // and the wildcard target here is a plain object, not a JS array.
            const shape = { meta: { x: { v: 1 }, y: { v: 2 } } };
            const expected = [[1, 2]];
            expect(
                new Collection({ a: shape }).pluck("meta.*.v").all(),
            ).toEqual(expected);
            expect(new Collection([shape]).pluck("meta.*.v").all()).toEqual(
                expected,
            );
        });

        it.fails(
            "plucks a Map-built collection's items in the order it holds them",
            () => {
                const rows = collect(
                    new Map([
                        [2, { n: "c", k: "kc" }],
                        [0, { n: "a", k: "ka" }],
                        [1, { n: "b", k: "kb" }],
                    ]),
                );

                // Ordered-backing gap: PHP plucks in insertion order, the row under key 2 first
                // docs/php-parity/task-30-map-order.json, "pluck-out-of-order"
                expect(rows.pluck("n").all()).toEqual(["c", "a", "b"]);
            },
        );
    });

    describe("map", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testMap
            const data = collect([1, 2, 3]);
            const mapped = data.map((item) => item * 2);
            expect(mapped.all()).toEqual([2, 4, 6]);
            expect(data.all()).toEqual([1, 2, 3]);

            const data2 = collect({ first: "taylor", last: "otwell" });
            const mapped2 = data2.map(
                (item, key) => `${key}-${item.split("").reverse().join("")}`,
            );
            expect(mapped2.all()).toEqual({
                first: "first-rolyat",
                last: "last-llewto",
            });
        });

        it("transforms each array item", () => {
            const collection = collect([1, 2, 3]);
            const mapped = collection.map((x) => x * 2);
            expect(mapped.all()).toEqual([2, 4, 6]);
        });

        it("transforms each object item", () => {
            const collection = collect({ a: 1, b: 2, c: 3 });
            const mapped = collection.map(
                (value, key) => `${String(key)}:${value * 2}`,
            );
            expect(mapped.all()).toEqual({ a: "a:2", b: "b:4", c: "c:6" });
        });

        it.fails(
            "keeps a Map-built collection's keys in the order it holds them",
            () => {
                const mapped = outOfOrderKeys().map(
                    (value, key) => `${value}!${key}`,
                );

                // Ordered-backing gap: PHP keeps the keys in insertion order, 2 before 0 and 1
                // docs/php-parity/task-30-map-order.json, "map-out-of-order"
                expect(mapped.keys().all()).toEqual([2, 0, 1]);
                expect(mapped.values().all()).toEqual(["c!2", "a!0", "b!1"]);
            },
        );
    });

    describe("mapToDictionary", () => {
        describe("Laravel Tests", () => {
            it("test map to dictionary", () => {
                // CollectionTest::testMapToDictionary
                const data = collect([
                    { id: 1, name: "A" },
                    { id: 2, name: "B" },
                    { id: 3, name: "C" },
                    { id: 4, name: "B" },
                ]);

                const groups = data.mapToDictionary((item) => {
                    return { [item.name]: item.id };
                });

                expect(groups).toBeInstanceOf(Collection);
                expect(groups.all()).toEqual({
                    A: [1],
                    B: [2, 4],
                    C: [3],
                });
                expect(Array.isArray(groups.get("A"))).toBe(true);

                const groups2 = data.mapToDictionary((item) => {
                    return { [item.name]: item.name };
                });

                expect(groups2.all()).toEqual({
                    A: ["A"],
                    B: ["B", "B"],
                    C: ["C"],
                });
            });

            it("test map to dictionary with numeric keys", () => {
                // CollectionTest::testMapToDictionaryWithNumericKeys
                const data = collect([1, 2, 3, 2, 1]);

                const groups = data.mapToDictionary((item, key) => {
                    return { [item]: key };
                });

                expect(groups.all()).toEqual({
                    1: [0, 4],
                    2: [1, 3],
                    3: [2],
                });

                const data2 = collect({ 1: "a", 2: "b", 3: "a" });

                const groups2 = data2.mapToDictionary((item, key) => {
                    return { [item]: key };
                });

                expect(groups2.all()).toEqual({
                    a: [1, 3],
                    b: [2],
                });
            });
        });

        it("files only the first pair the callback returns", () => {
            const dictionary = collect([1, 2]).mapToDictionary((value) => ({
                a: value,
                b: value * 10,
            }));

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-mapToDictionary-multi-pair-takes-first"
            expect(dictionary.all()).toEqual({ a: [1, 2] });
            expect(dictionary.keys().all()).toEqual(["a"]);
            expect(dictionary.values().all()).toEqual([[1, 2]]);
        });

        it("files a list the callback returns under key 0, its first pair", () => {
            const rows = collect([
                { id: 1, name: "A" },
                { id: 2, name: "B" },
            ]);

            const pairs = rows.mapToDictionary((row) => [row.name, row.id]);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-mapToDictionary-list-return"
            expect(pairs.all()).toEqual({ 0: ["A", "B"] });
            expect(pairs.keys().all()).toEqual([0]);
            expect(pairs.values().all()).toEqual([["A", "B"]]);

            const singles = rows.mapToDictionary((row) => [row.name]);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-mapToDictionary-one-item-list-return"
            expect(singles.all()).toEqual({ 0: ["A", "B"] });
            expect(singles.keys().all()).toEqual([0]);
            expect(singles.values().all()).toEqual([["A", "B"]]);
        });

        it("files false under an empty key when the callback returns no pair", () => {
            const dictionary = collect([1, 2]).mapToDictionary(() => []);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-mapToDictionary-empty-return"
            expect(dictionary.all()).toEqual({ "": [false, false] });
            expect(dictionary.keys().all()).toEqual([""]);
            expect(dictionary.values().all()).toEqual([[false, false]]);
        });
    });

    describe("mapWithKeys", () => {
        describe("Laravel Tests", () => {
            it("test map with keys", () => {
                // CollectionTest::testMapWithKeys
                const data = collect([
                    { name: "Blastoise", type: "Water", idx: 9 },
                    { name: "Charmander", type: "Fire", idx: 4 },
                    { name: "Dragonair", type: "Dragon", idx: 148 },
                ]);

                const mapped = data.mapWithKeys((pokemon) => {
                    return { [pokemon.name]: pokemon.type };
                });

                expect(mapped.all()).toEqual({
                    Blastoise: "Water",
                    Charmander: "Fire",
                    Dragonair: "Dragon",
                });
            });

            it("test map with keys integer keys", () => {
                // CollectionTest::testMapWithKeysIntegerKeys
                const data = collect([
                    { id: 1, name: "A" },
                    { id: 3, name: "B" },
                    { id: 2, name: "C" },
                ]);

                const mapped = data.mapWithKeys((item) => {
                    return { [item.id]: item };
                });

                expect(mapped.keys().all()).toEqual([1, 3, 2]);
            });

            it("test map with keys multiple rows", () => {
                // CollectionTest::testMapWithKeysMultipleRows
                const data = collect([
                    { id: 1, name: "A" },
                    { id: 2, name: "B" },
                    { id: 3, name: "C" },
                ]);

                const mapped = data.mapWithKeys((item) => {
                    return {
                        [item.id]: item.name,
                        [item.name]: item.id,
                    };
                });

                expect(mapped.all()).toEqual({
                    1: "A",
                    A: 1,
                    2: "B",
                    B: 2,
                    3: "C",
                    C: 3,
                });
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-mapWithKeys-multiple-rows-order"
                expect(mapped.keys().all()).toEqual([1, "A", 2, "B", 3, "C"]);
                expect(mapped.values().all()).toEqual(["A", 1, "B", 2, "C", 3]);
            });

            it("test map with keys callback key", () => {
                // CollectionTest::testMapWithKeysCallbackKey
                const data = collect(
                    new Map([
                        [3, { id: 1, name: "A" }],
                        [5, { id: 3, name: "B" }],
                        [4, { id: 2, name: "C" }],
                    ]),
                );

                const mapped = data.mapWithKeys((item, key) => {
                    return { [key]: item.id };
                });

                expect(mapped.keys().all()).toEqual([3, 5, 4]);
            });

            it("test map with keys overwriting keys", () => {
                // CollectionTest::testMapWithKeysOverwritingKeys
                const data = collect([
                    { id: 1, name: "A" },
                    { id: 2, name: "B" },
                    { id: 1, name: "C" },
                ]);

                const mapped = data.mapWithKeys((item) => {
                    return { [item.id]: item.name };
                });

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-mapWithKeys-overwriting-keys"
                expect(mapped.all()).toEqual({ 1: "C", 2: "B" });
                expect(mapped.keys().all()).toEqual([1, 2]);
                expect(mapped.values().all()).toEqual(["C", "B"]);
            });
        });

        it("walks a collection the callback returns by its items", () => {
            const mapped = collect([1, 2]).mapWithKeys((value) =>
                collect({ [`k${value}`]: value }),
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-mapWithKeys-returns-collection"
            expect(mapped.all()).toEqual({ k1: 1, k2: 2 });
            expect(mapped.keys().all()).toEqual(["k1", "k2"]);
            expect(mapped.values().all()).toEqual([1, 2]);
        });

        it("walks a Map the callback returns in its insertion order", () => {
            const mapped = collect([1]).mapWithKeys(
                () =>
                    new Map([
                        [2, "c"],
                        [0, "a"],
                    ]),
            );

            // JS-only: PHP has no Map, which stands for the array the callback returns in
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-mapWithKeys-out-of-order-return"
            expect(mapped.all()).toEqual({ 2: "c", 0: "a" });
            expect(mapped.keys().all()).toEqual([2, 0]);
            expect(mapped.values().all()).toEqual(["c", "a"]);
        });

        it("passes each source's own key shape to the callback", () => {
            // Array-backed: numeric index, matching arrMapWithKeys.
            const arraySeenKeys: unknown[] = [];
            collect(["a", "b"]).mapWithKeys((value, key) => {
                arraySeenKeys.push(key);
                return { [`${String(key)}_${value}`]: true };
            });
            expect(arraySeenKeys).toEqual([0, 1]);

            // Object-backed: the raw string key, matching objMapWithKeys —
            // not converted at all, so "0x10" and "1e3" reach the callback
            // as the keys the object literal declared.
            const objectSeenKeys: unknown[] = [];
            collect({ "0x10": "a", "1e3": "b" }).mapWithKeys((value, key) => {
                objectSeenKeys.push(key);
                return { [`${String(key)}_${value}`]: true };
            });
            expect(objectSeenKeys).toEqual(["0x10", "1e3"]);
        });

        it("never exposes the internal Map through .all(), either backing", () => {
            // JS-only: the result is built through a Map to keep PHP's key order, which all() must never hand back.
            const fromArray = collect([1, 2]).mapWithKeys((value) => ({
                [value]: value,
            }));
            expect(fromArray.all()).not.toBeInstanceOf(Map);
            expect(fromArray.all()).toEqual({ 1: 1, 2: 2 });

            const fromObject = collect({ a: 1, b: 2 }).mapWithKeys((value) => ({
                [value]: value,
            }));
            expect(fromObject.all()).not.toBeInstanceOf(Map);
            expect(fromObject.all()).toEqual({ 1: 1, 2: 2 });
        });
    });

    describe("merge", () => {
        describe("Laravel Tests", () => {
            it("test merge null", () => {
                // CollectionTest::testMergeNull
                const c = collect({ name: "hello" });
                expect(c.merge(null).all()).toEqual({ name: "hello" });
            });

            it("test merge array", () => {
                // CollectionTest::testMergeArray
                const c = collect({ name: "Hello" });
                expect(c.merge({ id: 1 }).all()).toEqual({
                    name: "Hello",
                    id: 1,
                });

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-merge-scalar-operand"
                // A scalar is outside merge()'s operand types; PHP's runtime casts it to an array holding it
                const d = collect(["hello"]);
                expect(Reflect.apply(d.merge, d, [1]).all()).toEqual([
                    "hello",
                    1,
                ]);
            });

            it("test merge collection", () => {
                // CollectionTest::testMergeCollection
                const c = collect({ name: "Hello" });
                expect(
                    c.merge(collect({ name: "World", id: 1 })).all(),
                ).toEqual({ name: "World", id: 1 });

                const d = collect(["hello"]);
                expect(d.merge(collect(["world"])).all()).toEqual([
                    "hello",
                    "world",
                ]);
            });
        });

        it("hands back a new instance for a null operand", () => {
            const collection = collect([1]);
            const merged = collection.merge(null);
            merged.push(2);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-merge-null-is-a-new-instance"
            expect(merged).not.toBe(collection);
            expect(collection.all()).toEqual([1]);
            expect(merged.all()).toEqual([1, 2]);
        });

        it("merge object items with array", () => {
            const merged = collect({ a: 1, b: 2 }).merge([3, 4]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-merge-assoc-then-list"
            expect(merged.all()).toEqual({ a: 1, b: 2, 0: 3, 1: 4 });
            expect(merged.keys().all()).toEqual(["a", "b", 0, 1]);
            expect(merged.values().all()).toEqual([1, 2, 3, 4]);
        });

        it("renumbers the receiver's integer keys in the order it holds them", () => {
            // A Map holds PHP's ['a' => 1, 5 => 'x'] in order, where a plain object lists the 5 first
            const merged = collect(
                new Map<string | number, string | number>([
                    ["a", 1],
                    [5, "x"],
                ]),
            ).merge(["y"]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-merge-int-keyed-record-then-list"
            expect(merged.all()).toEqual({ a: 1, 0: "x", 1: "y" });
            expect(merged.keys().all()).toEqual(["a", 0, 1]);
            expect(merged.values().all()).toEqual([1, "x", "y"]);
        });

        it("appends an integer key both sides hold, renumbered", () => {
            const merged = collect({ 5: "a" }).merge({ 5: "b" });

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-merge-same-int-key-appends"
            expect(merged.all()).toEqual(["a", "b"]);
            expect(merged.keys().all()).toEqual([0, 1]);
            expect(merged.values().all()).toEqual(["a", "b"]);
        });

        it("keeps a string key both sides hold in its first place, with the operand's value", () => {
            const merged = collect({ a: 1, b: 2 }).merge({ c: 3, a: 9 });

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-merge-string-key-keeps-its-place"
            expect(merged.all()).toEqual({ a: 9, b: 2, c: 3 });
            expect(merged.keys().all()).toEqual(["a", "b", "c"]);
            expect(merged.values().all()).toEqual([9, 2, 3]);
        });

        it("appends an operand's integer keys in the order it holds them", () => {
            const operand = () =>
                new Map([
                    [3, "x"],
                    [1, "y"],
                ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-merge-list-then-out-of-order-int-keys"
            for (const merged of [
                collect([1]).merge(operand()),
                collect([1]).merge(collect(operand())),
            ]) {
                expect(merged.all()).toEqual([1, "x", "y"]);
                expect(merged.keys().all()).toEqual([0, 1, 2]);
                expect(merged.values().all()).toEqual([1, "x", "y"]);
            }
        });

        it("renumbers a Map-built receiver in the order it holds its keys", () => {
            const merged = collect(
                new Map([
                    [2, "c"],
                    [0, "a"],
                    [1, "b"],
                ]),
            ).merge(["d"]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-merge-out-of-order-receiver"
            expect(merged.all()).toEqual(["c", "a", "b", "d"]);
            expect(merged.keys().all()).toEqual([0, 1, 2, 3]);
            expect(merged.values().all()).toEqual(["c", "a", "b", "d"]);
        });

        it("renumbers integer keys for a null operand too", () => {
            const merged = collect({ 5: "a", k: "b" }).merge(null);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-merge-null-renumbers"
            expect(merged.all()).toEqual({ 0: "a", k: "b" });
            expect(merged.keys().all()).toEqual([0, "k"]);
            expect(merged.values().all()).toEqual(["a", "b"]);
        });

        it("reads a plain object's all member as one of its entries, never unwrapping it", () => {
            const operand = { all: () => ({ b: 2 }) };
            const result = collect({ a: 1 }).merge(operand as never);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-plain-object-all-member-is-data-by-key"
            expect(result.all()).toEqual({ a: 1, all: operand.all });
            expect(result.keys().all()).toEqual(["a", "all"]);
            expect(result.values().all()).toEqual([1, operand.all]);
        });
    });

    describe("mergeRecursive", () => {
        describe("Laravel Tests", () => {
            it("test merge recursive null", () => {
                // CollectionTest::testMergeRecursiveNull
                const c = collect({ name: "hello" });
                expect(c.mergeRecursive(null).all()).toEqual({ name: "hello" });
            });

            it("test merge recursive array", () => {
                // CollectionTest::testMergeRecursiveArray
                const c = collect({ name: "Hello", id: 1 });
                expect(c.mergeRecursive({ id: 2 }).all()).toEqual({
                    name: "Hello",
                    id: [1, 2],
                });

                const d = collect({ name: "Hello", tags: ["a"] });
                expect(d.mergeRecursive({ tags: ["b", "c"] }).all()).toEqual({
                    name: "Hello",
                    tags: ["a", "b", "c"],
                });
            });

            it("test merge recursive collection", () => {
                // CollectionTest::testMergeRecursiveCollection
                const c = collect({
                    name: "Hello",
                    id: 1,
                    meta: { tags: ["a", "b"], roles: "admin" },
                });
                const merged = c.mergeRecursive(
                    collect({ meta: { tags: ["c"], roles: "editor" } }),
                );
                expect(merged.all()).toEqual({
                    name: "Hello",
                    id: 1,
                    meta: { tags: ["a", "b", "c"], roles: ["admin", "editor"] },
                });
            });
        });

        it("hands back a new instance for a null operand", () => {
            const collection = collect([1]);
            const merged = collection.mergeRecursive(null);
            merged.push(2);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-mergeRecursive-null-is-a-new-instance"
            expect(merged).not.toBe(collection);
            expect(collection.all()).toEqual([1]);
            expect(merged.all()).toEqual([1, 2]);
        });

        it("test target is array and source is not", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-mergeRecursive-list-meets-scalar"
            const target = collect({ a: [1, 2, 3] });
            const source = collect({ a: 4 });
            expect(target.mergeRecursive(source).all()).toEqual({
                a: [1, 2, 3, 4],
            });
        });

        it("test source is array and target is not", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-mergeRecursive-scalar-meets-list"
            const target = collect({ a: 7 });
            const source = collect({ a: [1, 2, 3] });
            expect(target.mergeRecursive(source).all()).toEqual({
                a: [7, 1, 2, 3],
            });
        });

        it("test merging existing keys and adding new keys", () => {
            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-F-mergeRecursive-spec-existing-and-new-keys"
            const target = collect({ a: 5, b: [3, 4], c: { z: 5, y: [9, 0] } });
            const source = collect({
                a: 6,
                b: [5, 6],
                c: { z: 6, y: [10, 11] },
                d: "new",
            });
            expect(target.mergeRecursive(source).all()).toEqual({
                a: [5, 6],
                b: [3, 4, 5, 6],
                c: { z: [5, 6], y: [9, 0, 10, 11] },
                d: "new",
            });
        });

        it("test merging arrays", () => {
            const target = collect([
                1,
                [4, 5, 7],
                { b: 4, c: 5, d: [8, 9], e: { x: 1, y: 2 } },
            ]);
            const source = collect([
                2,
                [6, 8],
                { b: 5, c: 6, d: [10, 11], e: { x: 3, z: 4 } },
                3,
            ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-mergeRecursive-spec-merging-arrays"
            expect(target.mergeRecursive(source).all()).toEqual([
                1,
                [4, 5, 7],
                { b: 4, c: 5, d: [8, 9], e: { x: 1, y: 2 } },
                2,
                [6, 8],
                { b: 5, c: 6, d: [10, 11], e: { x: 3, z: 4 } },
                3,
            ]);
        });

        it("test merging arrays when target array is longer than source", () => {
            const target = collect([1, [2, 3, 4], { a: 7, b: 8, c: 9 }]);
            const source = collect([5, [6]]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-mergeRecursive-spec-target-longer"
            expect(target.mergeRecursive(source).all()).toEqual([
                1,
                [2, 3, 4],
                { a: 7, b: 8, c: 9 },
                5,
                [6],
            ]);
        });

        it("test merging object and arrays", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-mergeRecursive-spec-object-and-arrays"
            const target = collect({ a: 1, b: [2, 3], c: { x: 4, y: 5 } });
            const source = collect({ a: [6, 7], b: 4, c: { x: [8, 9] } });
            expect(target.mergeRecursive(source).all()).toEqual({
                a: [1, 6, 7],
                b: [2, 3, 4],
                c: { x: [4, 8, 9], y: 5 },
            });

            const target2 = collect({ a: 1, b: { x: 2, y: 3 }, c: [4, 5] });
            const source2 = collect([[6, 7], 4, { x: [8, 9] }]);
            const merged2 = target2.mergeRecursive(source2);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-mergeRecursive-spec-object-then-list"
            expect(merged2.all()).toEqual({
                "0": [6, 7],
                "1": 4,
                "2": { x: [8, 9] },
                a: 1,
                b: { x: 2, y: 3 },
                c: [4, 5],
            });
            expect(merged2.keys().all()).toEqual(["a", "b", "c", 0, 1, 2]);
            expect(merged2.values().all()).toEqual([
                1,
                { x: 2, y: 3 },
                [4, 5],
                [6, 7],
                4,
                { x: [8, 9] },
            ]);
        });

        it("appends a list's items at the top level, as it does every integer key", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-mergeRecursive-list-list-appends"
            expect(
                collect([1, [2, 3]])
                    .mergeRecursive([4, [5]])
                    .all(),
            ).toEqual([1, [2, 3], 4, [5]]);
        });

        it("appends a scalar operand as one item", () => {
            const collection = collect([1]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-mergeRecursive-scalar-operand"
            // A scalar is outside mergeRecursive()'s operand types; PHP's runtime casts it to an array holding it
            expect(
                Reflect.apply(collection.mergeRecursive, collection, [2]).all(),
            ).toEqual([1, 2]);
        });

        it("keeps a record's string keys before the list it appends", () => {
            const merged = collect({ a: 1, b: 2 }).mergeRecursive([3, 4]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-mergeRecursive-assoc-then-list"
            expect(merged.all()).toEqual({ a: 1, b: 2, 0: 3, 1: 4 });
            expect(merged.keys().all()).toEqual(["a", "b", 0, 1]);
            expect(merged.values().all()).toEqual([1, 2, 3, 4]);
        });

        it("renumbers integer keys for a null operand too", () => {
            const merged = collect({ 5: "a", k: "b" }).mergeRecursive(null);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-mergeRecursive-null-renumbers"
            expect(merged.all()).toEqual({ 0: "a", k: "b" });
            expect(merged.keys().all()).toEqual([0, "k"]);
            expect(merged.values().all()).toEqual(["a", "b"]);
        });

        it("merges the values a string key both hold as arrays, a value that is not one joining the other", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-mergeRecursive-scalar-meets-assoc"
            expect(
                collect({ a: 1 })
                    .mergeRecursive({ a: { x: 1 } })
                    .get("a"),
            ).toEqual({ 0: 1, x: 1 });

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-mergeRecursive-assoc-meets-scalar"
            // PHP keeps x before 0, an order a nested plain object cannot hold.
            expect(
                collect({ a: { x: 1 } })
                    .mergeRecursive({ a: 2 })
                    .get("a"),
            ).toEqual({ x: 1, 0: 2 });

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-mergeRecursive-list-meets-assoc"
            expect(
                collect({ a: [1, 2] })
                    .mergeRecursive({ a: { x: 3 } })
                    .get("a"),
            ).toEqual({ 0: 1, 1: 2, x: 3 });

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-mergeRecursive-null-meets-scalar"
            expect(collect({ a: null }).mergeRecursive({ a: 1 }).all()).toEqual(
                { a: [null, 1] },
            );
        });

        it("appends a nested integer key after the highest one held", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-mergeRecursive-nested-int-keys-append"
            expect(
                collect({ a: { 5: "p" } })
                    .mergeRecursive({ a: { 5: "q" } })
                    .get("a"),
            ).toEqual({ 5: "p", 6: "q" });
        });

        it("keeps an object that is not a plain object whole", () => {
            const first = new Date(0);
            const second = new Date(86_400_000);

            // JS-only: PHP casts an object to an array of its properties and merges those, where a Date is one value
            expect(
                collect({ a: first }).mergeRecursive({ a: second }).get("a"),
            ).toEqual([first, second]);
        });
    });

    describe("multiply", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testMultiplyCollection
            const c = collect(["Hello", 1, { tags: ["a", "b"], 0: "admin" }]);

            expect(c.multiply(-1).all()).toEqual([]);
            expect(c.multiply(0).all()).toEqual([]);

            expect(c.multiply(1).all()).toEqual([
                "Hello",
                1,
                { tags: ["a", "b"], 0: "admin" },
            ]);

            expect(c.multiply(3).all()).toEqual([
                "Hello",
                1,
                { tags: ["a", "b"], 0: "admin" },
                "Hello",
                1,
                { tags: ["a", "b"], 0: "admin" },
                "Hello",
                1,
                { tags: ["a", "b"], 0: "admin" },
            ]);
        });

        it("repeats a record's values as a list", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-multiply-assoc"
            expect(collect({ a: 1, b: 2 }).multiply(2).all()).toEqual([
                1, 2, 1, 2,
            ]);
        });

        it("truncates a fractional count, as PHP's int parameter does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-multiply-fractional-count"
            expect(collect([1, 2]).multiply(2.5).all()).toEqual([1, 2, 1, 2]);
        });

        // A push that throws turns an endless repeat into a plain failure, since a count must be refused first
        class Unrepeatable extends Collection<number, number> {
            override push(): this {
                throw new Error("repeated before the count was checked");
            }
        }

        const refusedCount = expect.objectContaining({
            name: "TypeError",
            message:
                "Collection::multiply(): Argument #1 ($multiplier) must be of type int, float given",
        });

        it("throws PHP's TypeError for a NAN or infinite count, before repeating anything", () => {
            const collection = new Unrepeatable([1, 2]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-multiply-non-finite-count", whose
            // class the port names without PHP's namespace
            for (const count of [NaN, Infinity, -Infinity]) {
                expect(() => collection.multiply(count)).toThrowError(
                    refusedCount,
                );
            }
        });

        it("throws PHP's TypeError for a count outside PHP's int range, before repeating anything", () => {
            const collection = new Unrepeatable([1, 2]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-multiply-out-of-int-range-count"
            for (const count of [1e19, -1e19, 2 ** 63, -(2 ** 63) - 2048]) {
                expect(() => collection.multiply(count)).toThrowError(
                    refusedCount,
                );
            }
            expect(collection.multiply(-(2 ** 63)).all()).toEqual([]);
        });

        it.fails(
            "repeats a Map-built receiver's values in the order it holds them",
            () => {
                // Ordered-backing gap: PHP repeats the values in the receiver's insertion order, key 2 first
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-receiver-out-of-order"
                expect(outOfOrderKeys().multiply(2).all()).toEqual([
                    "c",
                    "a",
                    "b",
                    "c",
                    "a",
                    "b",
                ]);
            },
        );
    });

    describe("combine", () => {
        describe("Laravel Tests", () => {
            it("test combine with array", () => {
                // CollectionTest::testCombineWithArray
                const c = collect([1, 2, 3]);
                expect(c.combine([4, 5, 6]).all()).toEqual({
                    1: 4,
                    2: 5,
                    3: 6,
                });

                const d = collect(["name", "family"]).combine({
                    1: "taylor",
                    2: "otwell",
                });
                expect(d.all()).toEqual({ name: "taylor", family: "otwell" });
                expect(d.keys().all()).toEqual(["name", "family"]);
                expect(d.values().all()).toEqual(["taylor", "otwell"]);

                const e = collect({ 1: "name", 2: "family" }).combine([
                    "taylor",
                    "otwell",
                ]);
                expect(e.all()).toEqual({ name: "taylor", family: "otwell" });
                expect(e.keys().all()).toEqual(["name", "family"]);
                expect(e.values().all()).toEqual(["taylor", "otwell"]);

                const f = collect({ 1: "name", 2: "family" });
                expect(f.combine({ 2: "taylor", 3: "otwell" }).all()).toEqual({
                    name: "taylor",
                    family: "otwell",
                });
            });

            it("test combine with collection", () => {
                // CollectionTest::testCombineWithCollection
                const c = collect([1, 2, 3]);
                expect(c.combine(collect([4, 5, 6])).all()).toEqual({
                    1: 4,
                    2: 5,
                    3: 6,
                });

                const f = collect({ 1: "name", 2: "family" });
                expect(
                    f.combine(collect({ 2: "taylor", 3: "otwell" })).all(),
                ).toEqual({
                    name: "taylor",
                    family: "otwell",
                });
            });
        });

        // A key/value count mismatch used to silently produce `undefined` values or
        // truncate instead of throwing. PHP-verified message
        // (docs/php-parity/task-04-shared.json, "array_combine mismatch").
        it("throws when the key and value counts differ — both shapes agree", () => {
            expect(() => collect(["a", "b"]).combine([1])).toThrow(
                "array_combine(): Argument #1 ($keys) and argument #2 ($values) must have the same number of elements",
            );
            expect(() => collect({ x: "a", y: "b" }).combine({ p: 1 })).toThrow(
                "array_combine(): Argument #1 ($keys) and argument #2 ($values) must have the same number of elements",
            );
        });

        it("throws with fewer or with more values than keys", () => {
            // docs/php-parity/task-31-laravel-13-33-sync.json, "combine-fewer-values" and "combine-more-values":
            // PHP throws a ValueError, which this port raises as an Error carrying the same message.
            const message =
                "array_combine(): Argument #1 ($keys) and argument #2 ($values) must have the same number of elements";

            // CollectionTest::testCombineWithFewerValuesThanKeysThrows
            expect(() => collect([1, 2]).combine([3])).toThrow(message);
            // CollectionTest::testCombineWithMoreValuesThanKeysThrows
            expect(() => collect([1]).combine([2, 3])).toThrow(message);
        });

        it("hands back an empty list for a null operand when there are no keys", () => {
            const combined = collect([]).combine(null);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-combine-null-operand-on-empty"
            expect(combined.all()).toEqual([]);
            expect(combined.keys().all()).toEqual([]);
            expect(combined.values().all()).toEqual([]);
        });

        it("throws for a null operand while there are keys to pair", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-combine-null-operand-throws"
            expect(() => collect(["a"]).combine(null)).toThrow(
                "array_combine(): Argument #1 ($keys) and argument #2 ($values) must have the same number of elements",
            );
        });

        it("casts a null key to the empty string, matching array_combine", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "D5 combine null/bool/float keys"
            expect(collect({ k: null }).combine([1]).all()).toEqual({
                "": 1,
            });
        });

        it("combines a list backing with a keyed operand's values", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "combine-list-keyed-values"
            expect(collect([1, 2]).combine({ a: "x", b: "y" }).all()).toEqual({
                1: "x",
                2: "y",
            });
        });

        it("keys a float by PHP's (string) cast", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "combine-float-keys"
            const keys = collect([
                10000000000000.5, 10000000000001.5, 99999999999999.98,
            ])
                .combine([1, 2, 3])
                .keys()
                .all();
            expect(keys).toEqual([10000000000000, 10000000000002, "1.0E+14"]);
        });

        it("keys by its own values, without calling an all() its object backing inherits", () => {
            // JS-only: Collection::combine keys by $this->all(), an array with no methods; JS objects inherit them.
            class Repo {
                name = "repo";

                all() {
                    return ["CALLED"];
                }
            }

            expect(new Collection(new Repo()).combine([1]).all()).toEqual({
                repo: 1,
            });
        });

        it("reads a plain object's all member as one of its values, never unwrapping it", () => {
            const operand = { all: () => ["v"] };
            const result = collect(["k"]).combine(operand);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-plain-object-all-member-is-data"
            expect(result.all()).toEqual({ k: operand.all });
            expect(result.keys().all()).toEqual(["k"]);
            expect(result.values().all()).toEqual([operand.all]);
        });

        it.fails(
            "pairs a Map-built operand's values in the order it holds them",
            () => {
                const combined = collect(["x", "y"]).combine(
                    collect(
                        new Map([
                            [2, "c"],
                            [0, "a"],
                        ]),
                    ),
                );

                // Ordered-backing gap: PHP pairs the operand's values in its insertion order, the one under key 2 first
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-operand-out-of-order"
                expect([
                    combined.keys().all(),
                    combined.values().all(),
                ]).toEqual([
                    ["x", "y"],
                    ["c", "a"],
                ]);
            },
        );
    });

    describe("union", () => {
        describe("Laravel Tests", () => {
            it("test union null", () => {
                // CollectionTest::testUnionNull
                const c = collect({ name: "Hello" });
                expect(c.union(null).all()).toEqual({ name: "Hello" });
            });

            it("test union array", () => {
                // CollectionTest::testUnionArray
                const c = collect({ name: "Hello" });
                expect(c.union({ id: 1 }).all()).toEqual({
                    name: "Hello",
                    id: 1,
                });
            });

            it("test union collection", () => {
                // CollectionTest::testUnionCollection
                // docs/php-parity/task-23-obj-release-readiness.json, "C18 union collection"
                const c = collect({ name: "Hello" });
                const united = c.union(collect({ name: "World", id: 1 }));

                expect(united.all()).toEqual({ name: "Hello", id: 1 });
                expect(united.keys().all()).toEqual(["name", "id"]);
                expect(united.values().all()).toEqual(["Hello", 1]);
            });
        });

        it("hands back a new instance for a null operand", () => {
            const collection = collect([1]);
            const united = collection.union(null);
            united.push(2);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-union-null-is-a-new-instance"
            expect(united).not.toBe(collection);
            expect(collection.all()).toEqual([1]);
            expect(united.all()).toEqual([1, 2]);
        });

        it("keeps the receiver's keys for a null operand, where merge() renumbers them", () => {
            const united = collect({ 5: "a", k: "b" }).union(null);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-union-null-keeps-keys"
            expect(united.all()).toEqual({ 5: "a", k: "b" });
            expect(united.keys().all()).toEqual([5, "k"]);
            expect(united.values().all()).toEqual(["a", "b"]);
        });

        it("lets the left operand win even when its value is undefined", () => {
            // docs/php-parity/task-07-pad-union.json, "Collection::union"
            // JS-only: undefined stands in for PHP's null, which the left operand keeps
            const c = collect({ a: undefined });
            const result = c.union({ a: 1, b: 2 }).all();
            expect(result).toEqual({ a: undefined, b: 2 });
            // toEqual alone would also pass if "a" were dropped entirely
            // (Vitest 4 treats an undefined-valued key as equal to an
            // absent one); assert the key actually exists too.
            expect(result).toHaveProperty("a");
        });

        // Every union test above this point is object-backed, which is why nothing here
        // caught arr.union concatenating values instead of unioning keys.
        it("unions array-backed collections by key, mirroring PHP's + operator", () => {
            // Every index the right side could fill (0-2) is already
            // occupied by the left, so it contributes nothing.
            expect(collect([1, 2, 3]).union([3, 4, 5]).all()).toEqual([
                1, 2, 3,
            ]);
            // The left only fills indices 0-1, so index 2 ("5") still comes
            // from the right.
            expect(collect([1, 2]).union([3, 4, 5]).all()).toEqual([1, 2, 5]);
        });

        it("agrees whether array- or object-backed, over the same conceptual data", () => {
            // JS-only: PHP has one array type, where a list and a record backing must agree over the same entries
            const fromArray = collect([1, 2]);
            const fromObject = collect({ 0: 1, 1: 2 });

            expect(fromArray.union([3, 4, 5]).all()).toEqual([1, 2, 5]);
            expect(
                Object.values(fromObject.union({ 0: 3, 1: 4, 2: 5 }).all()),
            ).toEqual([1, 2, 5]);
        });

        it("takes an operand of the other shape, on either backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "union-list-operand", "union-list-keyed-operand"
            expect(collect({ a: 1 }).union([5]).all()).toEqual({ a: 1, 0: 5 });
            expect(collect([1, 2]).union({ 2: "z" }).all()).toEqual([
                1,
                2,
                "z",
            ]);
        });

        it("keeps the receiver's keys first, then those the operand adds", () => {
            const united = collect({ a: 1 }).union([5]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-union-assoc-then-list"
            expect(united.all()).toEqual({ a: 1, 0: 5 });
            expect(united.keys().all()).toEqual(["a", 0]);
            expect(united.values().all()).toEqual([1, 5]);
        });

        it("adds an operand's keys in the order it holds them", () => {
            const united = collect([1, 2, 3]).union(
                new Map([
                    [7, "x"],
                    [3, "y"],
                ]),
            );

            // docs/php-parity/task-26-collection-order.json, "order-union-result"
            expect(united.all()).toEqual({ 0: 1, 1: 2, 2: 3, 7: "x", 3: "y" });
            expect(united.keys().all()).toEqual([0, 1, 2, 7, 3]);
            expect(united.values().all()).toEqual([1, 2, 3, "x", "y"]);
        });

        it("keeps a Map-built receiver's keys in the order it holds them", () => {
            const united = outOfOrderKeys().union({ 3: "d", k: "e" });

            // docs/php-parity/task-30-map-order.json, "union-out-of-order"
            expect(united.all()).toEqual({
                0: "a",
                1: "b",
                2: "c",
                3: "d",
                k: "e",
            });
            expect(united.keys().all()).toEqual([2, 0, 1, 3, "k"]);
            expect(united.values().all()).toEqual(["c", "a", "b", "d", "e"]);
        });

        it("reads a plain object's all member as one of its entries, never unwrapping it", () => {
            const operand = { all: () => ({ b: 2 }) };
            const result = collect({ a: 1 }).union(operand as never);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-plain-object-all-member-is-data"
            expect(result.all()).toEqual({ a: 1, all: operand.all });
            expect(result.keys().all()).toEqual(["a", "all"]);
            expect(result.values().all()).toEqual([1, operand.all]);
        });

        it("keeps its own items when one is a function stored under an all or toJSON key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "union-function-valued-member"
            let calls = 0;
            const fn = () => {
                calls++;

                return "X";
            };

            expect(
                collect({ all: fn, admin: "a" }).union({ guest: 1 }).all(),
            ).toEqual({ all: fn, admin: "a", guest: 1 });
            expect(collect({ toJSON: fn, b: 2 }).union({ c: 3 }).all()).toEqual(
                { toJSON: fn, b: 2, c: 3 },
            );
            expect(calls).toBe(0);
        });

        it("becomes object-backed when a keyed operand leaves its list keys other than 0..n-1", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "union-list-backing-keyed-result"
            expect(new Collection().union({ a: 1 }).all()).toEqual({ a: 1 });
            expect(collect([1, 2]).union({ a: 1, 5: 9 }).all()).toEqual({
                0: 1,
                1: 2,
                a: 1,
                5: 9,
            });
        });
    });

    describe("nth", () => {
        it("throws PHP's Modulo by zero for a step the int cast wraps to 0", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-nth-and-split-by-a-count-cast-to-0"
            expect(() => collect([1, 2, 3]).nth(2 ** 64)).toThrow(
                new Error("Modulo by zero"),
            );
        });

        it("test nth", () => {
            // CollectionTest::testNth
            // Use Map to preserve insertion order for numeric keys (JavaScript objects auto-sort numeric keys)
            const data = collect(
                new Map([
                    [6, "a"],
                    [4, "b"],
                    [7, "c"],
                    [1, "d"],
                    [5, "e"],
                    [3, "f"],
                ]),
            );

            expect(data.nth(4).all()).toEqual(["a", "e"]);
            expect(data.nth(4, 1).all()).toEqual(["b", "f"]);
            expect(data.nth(4, 2).all()).toEqual(["c"]);
            expect(data.nth(4, 3).all()).toEqual(["d"]);
            expect(data.nth(2, 2).all()).toEqual(["c", "e"]);
            expect(data.nth(1, 2).all()).toEqual(["c", "d", "e", "f"]);
            expect(data.nth(1, 2).all()).toEqual(["c", "d", "e", "f"]);
            expect(data.nth(1, -2).all()).toEqual(["e", "f"]);
            expect(data.nth(2, -4).all()).toEqual(["c", "e"]);
            expect(data.nth(4, -2).all()).toEqual(["e"]);
            expect(data.nth(2, -2).all()).toEqual(["e"]);
        });

        it("throws exception for invalid step", () => {
            // CollectionTest::testNthThrowsExceptionForInvalidStep
            expect(() => {
                collect([1, 2, 3]).nth(0);
            }).toThrowError(InvalidArgumentException);
            expect(() => {
                collect([1, 2, 3]).nth(0);
            }).toThrowError("Step value must be at least 1.");
        });

        it("throws exception for negative step", () => {
            // CollectionTest::testNthThrowsExceptionForNegativeStep
            expect(() => {
                collect([1, 2, 3]).nth(-1);
            }).toThrowError(InvalidArgumentException);
            expect(() => {
                collect([1, 2, 3]).nth(-1);
            }).toThrowError("Step value must be at least 1.");
        });

        it("collects a record's every n-th value into a list", () => {
            const every = collect({ a: 1, b: 2, c: 3, d: 4, e: 5 }).nth(2);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-nth-assoc"
            expect(viewsOf(every)).toEqual({
                all: [1, 3, 5],
                keys: [0, 1, 2],
                values: [1, 3, 5],
            });
        });

        it("steps as PHP's % does, which drops a fraction from the step", () => {
            const numbers = collect([1, 2, 3, 4, 5]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-nth-counts"
            expect(numbers.nth(1.5).all()).toEqual([1, 2, 3, 4, 5]);
            expect(numbers.nth(2.5).all()).toEqual([1, 3, 5]);
            expect(numbers.nth(1e19).all()).toEqual([1]);
        });

        it("divides by zero for a NAN or infinite step, once there is an item to step over", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-nth-counts"
            for (const step of [NaN, Infinity]) {
                expect(() => collect([1, 2, 3, 4, 5]).nth(step)).toThrowError(
                    "Modulo by zero",
                );
            }

            expect(collect([]).nth(NaN).all()).toEqual([]);
        });

        it("slices from its offset as slice() does, dropping a fraction and refusing a NAN", () => {
            const numbers = collect([1, 2, 3, 4, 5]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-nth-counts"
            expect(numbers.nth(1, 1.5).all()).toEqual([2, 3, 4, 5]);

            // Same row over [1..5], and "C32-G-nth-out-of-order-offset" over PHP's [2 => 'c', 0 => 'a', 1 => 'b']
            for (const collection of [numbers, outOfOrderKeys()]) {
                for (const offset of [NaN, 1e19]) {
                    expect(() => collection.nth(1, offset)).toThrowError(
                        TypeError,
                    );
                    expect(() => collection.nth(1, offset)).toThrowError(
                        "array_slice(): Argument #2 ($offset) must be of type int, float given",
                    );
                }
            }
        });

        it("uses itemsWithOrder when available", () => {
            // Only a Map-built collection carries itemsWithOrder now; sortBy
            // renumbers its keys instead, so the object itself holds the order.
            const c = collect(
                new Map([
                    [2, "c"],
                    [0, "a"],
                    [1, "b"],
                ]),
            );
            expect(c.nth(1).all()).toEqual(["c", "a", "b"]);
            expect(
                collect({ 1: "a", 0: "b", 2: "c" })
                    .sortBy((v) => v)
                    .nth(1)
                    .all(),
            ).toEqual(["a", "b", "c"]);
        });

        it("uses Object.entries when itemsWithOrder is not available", () => {
            // Create collection with object keys (no Map) - no itemsWithOrder is set
            const c = collect({ a: 1, b: 2, c: 3, d: 4, e: 5 });
            // nth should use Object.entries branch
            expect(c.nth(2).all()).toEqual([1, 3, 5]);
            expect(c.nth(2, 1).all()).toEqual([2, 4]);
        });
    });

    describe("only", () => {
        it("Laravel Tests", () => {
            // CollectionTest::testOnly
            const c = collect({
                first: "Taylor",
                last: "Otwell",
                email: "taylorotwell@gmail.com",
            });

            expect(c.only(null).all()).toEqual(c.all());

            expect(c.only(["first", "missing"]).all()).toEqual({
                first: "Taylor",
            });
            expect(c.only("first", "missing").all()).toEqual({
                first: "Taylor",
            });
            expect(c.only(collect(["first", "missing"])).all()).toEqual({
                first: "Taylor",
            });

            expect(c.only(["first", "email"]).all()).toEqual({
                first: "Taylor",
                email: "taylorotwell@gmail.com",
            });
            expect(c.only("first", "email").all()).toEqual({
                first: "Taylor",
                email: "taylorotwell@gmail.com",
            });
            expect(c.only(collect(["first", "email"])).all()).toEqual({
                first: "Taylor",
                email: "taylorotwell@gmail.com",
            });
        });

        // Arr.php:744 casts via (array) $keys, so a bare key and a null key both work
        // directly, not just spread via varargs. Array- and object-backed Collections
        // must agree, per the unison rule.
        it("accepts a single key and a null key, either backing", () => {
            expect(collect(["a", "b", "c"]).only(1).all()).toEqual(["b"]);
            expect(collect(["a", "b", "c"]).only(null).all()).toEqual([
                "a",
                "b",
                "c",
            ]);

            expect(collect({ foo: 1, bar: "baz" }).only("bar").all()).toEqual({
                bar: "baz",
            });
            expect(collect({ a: 1 }).only(null).all()).toEqual({ a: 1 });
        });

        it("keeps a list's own order, not the order of the keys", () => {
            const only = collect(["a", "b", "c", "d"]).only([3, 1]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-only-list-keys", whose keys 1 and 3
            // name these items; a list renumbers them, as every removal from a list does
            expect(only.all()).toEqual(["b", "d"]);
            expect(only.keys().all()).toEqual([0, 1]);
        });

        describe("reads its keys as PHP's $keys argument", () => {
            const person = () =>
                collect({ first: "Taylor", last: "Otwell", email: "e" });

            it("keeps every item when the first argument is null, whatever follows", () => {
                const only = person().only(null, "first");

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-only-null-first-arg"
                expect(only.all()).toEqual({
                    first: "Taylor",
                    last: "Otwell",
                    email: "e",
                });
                expect(only.keys().all()).toEqual(["first", "last", "email"]);
                expect(only.values().all()).toEqual(["Taylor", "Otwell", "e"]);
            });

            it("keeps every item for an undefined key, as except() does", () => {
                // CollectionTest::testOnly
                // JS-only: undefined stands for PHP's null, which only() answers with every item
                expect(person().only(undefined).all()).toEqual(person().all());
            });

            it("ignores the arguments after an array of keys", () => {
                const only = person().only(["first"], "last");

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-only-array-then-extra-arg"
                expect(only.all()).toEqual({ first: "Taylor" });
                expect(only.keys().all()).toEqual(["first"]);
                expect(only.values().all()).toEqual(["Taylor"]);
            });

            it("takes a keyed Collection's values as the keys", () => {
                const only = person().only(collect({ x: "first", y: "email" }));

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-only-keyed-collection-arg"
                expect(only.all()).toEqual({ first: "Taylor", email: "e" });
                expect(only.keys().all()).toEqual(["first", "email"]);
                expect(only.values().all()).toEqual(["Taylor", "e"]);
            });

            it("keeps nothing for an empty array of keys", () => {
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-only-empty-array"
                expect(person().only([]).all()).toEqual({});
            });

            it("skips a later key array_flip cannot store: a null, an array or a collection", () => {
                const odd = collect({ a: 1, b: 2 });

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-only-odd-later-args"
                expect(
                    collect({ null: 1, a: 2 }).only("a", null).all(),
                ).toEqual({
                    a: 2,
                });
                expect(odd.only("a", ["b"]).all()).toEqual({ a: 1 });
                expect(
                    odd.only("a", collect(["b"]) as unknown as string).all(),
                ).toEqual({ a: 1 });
                expect(collect(["x", "y"]).only(0, [1]).all()).toEqual(["x"]);
            });

            it("skips a later undefined key, as it skips null", () => {
                // JS-only: undefined stands for PHP's null, which array_flip skips.
                expect(
                    collect({ undefined: 1, a: 2 }).only("a", undefined).all(),
                ).toEqual({ a: 2 });
            });
        });

        it("reads a dotted key literally, never as a path", () => {
            const literal = collect({ a: { b: 1 }, "a.b": 2 }).only("a.b");
            const nested = collect({ a: { b: 1, c: 2 } }).only("a.b");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-only-dot-key-literal"
            expect(literal.all()).toEqual({ "a.b": 2 });
            expect([literal.keys().all(), literal.values().all()]).toEqual([
                ["a.b"],
                [2],
            ]);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-only-dot-key-nested-miss"
            expect(nested.all()).toEqual({});
            expect([nested.keys().all(), nested.values().all()]).toEqual([
                [],
                [],
            ]);
        });

        it("hands back a copy for a null key, as except() and select() do", () => {
            const collection = collect({ a: 1 });
            const copies = [
                collection.only(null),
                collection.except(null),
                collection.select(null),
            ];

            for (const copy of copies) {
                copy.put("b", 2);
            }

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-null-keys-copy"
            expect([
                collection.all(),
                ...copies.map((copy) => copy.all()),
            ]).toEqual([
                { a: 1 },
                { a: 1, b: 2 },
                { a: 1, b: 2 },
                { a: 1, b: 2 },
            ]);
            expect(collection.keys().all()).toEqual(["a"]);
        });
    });

    describe("select", () => {
        describe("Laravel Tests", () => {
            it("test select with arrays", () => {
                // CollectionTest::testSelectWithArrays
                const data = collect([
                    {
                        first: "Taylor",
                        last: "Otwell",
                        email: "taylorotwell@gmail.com",
                    },
                    {
                        first: "Jess",
                        last: "Archer",
                        email: "jessarcher@gmail.com",
                    },
                ]);

                expect(data.select(null).all()).toEqual(data.all());
                expect(data.select(["first", "missing"]).all()).toEqual([
                    { first: "Taylor" },
                    { first: "Jess" },
                ]);
                expect(data.select("first", "missing").all()).toEqual([
                    { first: "Taylor" },
                    { first: "Jess" },
                ]);
                expect(
                    data.select(collect(["first", "missing"])).all(),
                ).toEqual([{ first: "Taylor" }, { first: "Jess" }]);

                expect(data.select(["first", "email"]).all()).toEqual([
                    {
                        first: "Taylor",
                        email: "taylorotwell@gmail.com",
                    },
                    {
                        first: "Jess",
                        email: "jessarcher@gmail.com",
                    },
                ]);

                expect(data.select("first", "email").all()).toEqual([
                    {
                        first: "Taylor",
                        email: "taylorotwell@gmail.com",
                    },
                    {
                        first: "Jess",
                        email: "jessarcher@gmail.com",
                    },
                ]);

                expect(data.select(collect(["first", "email"])).all()).toEqual([
                    {
                        first: "Taylor",
                        email: "taylorotwell@gmail.com",
                    },
                    {
                        first: "Jess",
                        email: "jessarcher@gmail.com",
                    },
                ]);
            });

            it("test select with array access", () => {
                // CollectionTest::testSelectWithArrayAccess, whose ArrayAccess rows a Collection stands in for
                const data = collect([
                    collect({
                        first: "Taylor",
                        last: "Otwell",
                        email: "taylorotwell@gmail.com",
                    }),
                    collect({
                        first: "Jess",
                        last: "Archer",
                        email: "jessarcher@gmail.com",
                    }),
                ]);
                const firstAndEmail = [
                    { first: "Taylor", email: "taylorotwell@gmail.com" },
                    { first: "Jess", email: "jessarcher@gmail.com" },
                ];

                expect(data.select(null).all()).toEqual(data.all());
                expect(data.select(["first", "missing"]).all()).toEqual([
                    { first: "Taylor" },
                    { first: "Jess" },
                ]);
                expect(data.select("first", "missing").all()).toEqual([
                    { first: "Taylor" },
                    { first: "Jess" },
                ]);
                expect(
                    data.select(collect(["first", "missing"])).all(),
                ).toEqual([{ first: "Taylor" }, { first: "Jess" }]);
                expect(data.select(["first", "email"]).all()).toEqual(
                    firstAndEmail,
                );
                expect(data.select("first", "email").all()).toEqual(
                    firstAndEmail,
                );
                expect(data.select(collect(["first", "email"])).all()).toEqual(
                    firstAndEmail,
                );
            });

            it("test select with objects", () => {
                // CollectionTest::testSelectWithObjects, whose (object) casts a class instance stands in for
                class Person {
                    first: string;
                    last: string;
                    email: string;

                    constructor(first: string, last: string, email: string) {
                        this.first = first;
                        this.last = last;
                        this.email = email;
                    }
                }

                const data = collect([
                    new Person("Taylor", "Otwell", "taylorotwell@gmail.com"),
                    new Person("Jess", "Archer", "jessarcher@gmail.com"),
                ]);

                expect(data.select(null).all()).toEqual(data.all());

                expect(data.select(["first", "missing"]).all()).toEqual([
                    { first: "Taylor" },
                    { first: "Jess" },
                ]);

                expect(data.select("first", "missing").all()).toEqual([
                    { first: "Taylor" },
                    { first: "Jess" },
                ]);

                expect(
                    data.select(collect(["first", "missing"])).all(),
                ).toEqual([{ first: "Taylor" }, { first: "Jess" }]);

                expect(data.select(["first", "email"]).all()).toEqual([
                    {
                        first: "Taylor",
                        email: "taylorotwell@gmail.com",
                    },
                    {
                        first: "Jess",
                        email: "jessarcher@gmail.com",
                    },
                ]);

                expect(data.select("first", "email").all()).toEqual([
                    {
                        first: "Taylor",
                        email: "taylorotwell@gmail.com",
                    },
                    {
                        first: "Jess",
                        email: "jessarcher@gmail.com",
                    },
                ]);

                expect(data.select(collect(["first", "email"])).all()).toEqual([
                    {
                        first: "Taylor",
                        email: "taylorotwell@gmail.com",
                    },
                    {
                        first: "Jess",
                        email: "jessarcher@gmail.com",
                    },
                ]);
            });
        });

        it("selects an item's own keys, never its prototype's", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-select-prototype-key-names"
            expect(
                collect([{ a: 1 }])
                    .select("toString", "constructor", "a")
                    .all(),
            ).toEqual([{ a: 1 }]);
        });

        it("selects a list item by index", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-select-int-key"
            expect(
                collect([[10, 20, 30]])
                    .select([0, 2])
                    .all(),
            ).toEqual([{ 0: 10, 2: 30 }]);
        });

        it("selects a Map item by the key PHP stores", () => {
            const item = new Map<string | number, unknown>([
                ["a", 1],
                [1, "x"],
            ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-select-integer-string-key": a Map
            // stands for the PHP array
            expect(collect([item]).select("1", "a").all()).toEqual([
                { 1: "x", a: 1 },
            ]);
        });

        it("reads an ArrayAccess item through its offsets, then a property isset() finds", () => {
            class Access {
                a = "prop-a";
                p = "prop-p";
                q = null;
                readonly #items: Record<string, unknown>;

                constructor(items: Record<string, unknown>) {
                    this.#items = items;
                }

                offsetExists(offset: string): boolean {
                    return Object.hasOwn(this.#items, offset);
                }

                offsetGet(offset: string): unknown {
                    return this.#items[offset];
                }
            }
            const selected = collect([new Access({ a: "offset-a", n: null })])
                .select("a", "n", "p", "q", "missing")
                .all();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-select-arrayaccess-rows"
            expect(selected).toEqual([{ a: "offset-a", n: null, p: "prop-p" }]);
        });

        it("selects a Collection item by its items' keys, never its methods", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-select-collection-rows"
            expect(
                collect([collect({ a: 1, b: 2 })])
                    .select("a")
                    .all(),
            ).toEqual([{ a: 1 }]);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-select-object-method-name"
            expect(
                collect([collect({ a: 1 })])
                    .select("all", "a")
                    .all(),
            ).toEqual([{ a: 1 }]);
        });

        it("reads none of a Collection item's own fields, which hold its items and state", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-select-collection-row-fields"
            expect(
                collect([collect({ a: 1 })])
                    .select("items", "a")
                    .all(),
            ).toEqual([{ a: 1 }]);
        });

        it("throws array_key_exists()'s TypeError for an array key over an array item, and skips it elsewhere", () => {
            class Row {
                a = 1;
                b = 2;
            }

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-array-key-type-error"
            expect(() => collect([{ a: 1, b: 2 }]).select("a", ["b"])).toThrow(
                new TypeError(
                    "array_key_exists(): Argument #1 ($key) must be a valid array offset type",
                ),
            );
            expect(collect([new Row()]).select("a", ["b"]).all()).toEqual([
                { a: 1 },
            ]);
            expect(collect([1]).select("a", ["b"]).all()).toEqual([{}]);
            expect(collect([]).select("a", ["b"]).all()).toEqual([]);
        });

        it("skips an array key over a Collection item", () => {
            // JS-only: PHP's has() reads the array as a list of keys; as this item holds them all, offsetGet then
            // throws for the array itself, where an item missing any of them skips it, as JS does for every item.
            expect(
                collect([collect({ a: 1, b: 2 })])
                    .select("a", ["b"])
                    .all(),
            ).toEqual([{ a: 1 }]);
        });

        it("reads a dotted key literally, never as a path", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-select-dot-path-literal"
            expect(
                collect([{ id: 1, details: { age: 30, city: "NY" } }])
                    .select(["id", "details.age"])
                    .all(),
            ).toEqual([{ id: 1 }]);
        });

        it("selects nothing from a scalar item", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-select-scalar-items"
            expect(collect([1, "x", null]).select("a").all()).toEqual([
                {},
                {},
                {},
            ]);
        });

        it("drops an object's null property, as PHP's isset does, where a plain object's null stays", () => {
            class Row {
                a = null;
                b = 1;
            }

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-select-object-null-prop"
            expect(collect([new Row()]).select("a", "b").all()).toEqual([
                { b: 1 },
            ]);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-select-array-null-value"
            expect(
                collect([{ a: null, b: 1 }])
                    .select("a", "b")
                    .all(),
            ).toEqual([{ a: null, b: 1 }]);
        });

        describe("reads its keys as PHP's $keys argument", () => {
            it("keeps every item whole when the first argument is null, whatever follows", () => {
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-select-null-then-key"
                expect(
                    collect([{ a: 1, b: 2 }])
                        .select(null, "a")
                        .all(),
                ).toEqual([{ a: 1, b: 2 }]);
            });

            it("keeps every item whole for an undefined key, as except() does", () => {
                const data = collect([{ a: 1, b: 2 }]);

                // CollectionTest::testSelectWithArrays
                // JS-only: undefined stands for PHP's null, which select() answers with every item whole
                expect(data.select(undefined).all()).toEqual(data.all());
            });

            it("reads a null among the keys as the '' key, as Arr::exists casts it", () => {
                const rows = collect([{ "": "e", a: 1 }]);
                const trailing = rows.select("a", null).all();

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-select-null-key-cast"
                expect(rows.select([null, "a"]).all()).toEqual([
                    { "": "e", a: 1 },
                ]);
                expect(trailing).toEqual([{ a: 1, "": "e" }]);
                expect(Object.keys(trailing[0] ?? {})).toEqual(["a", ""]);
            });

            it("ignores the arguments after an array of keys", () => {
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-select-array-then-extra-arg"
                expect(
                    collect([{ first: "T", last: "O" }])
                        .select(["first"], "last")
                        .all(),
                ).toEqual([{ first: "T" }]);
            });

            it("takes a keyed Collection's values as the keys", () => {
                const people = collect([{ first: "T", last: "O", email: "e" }]);
                // A keyed Collection is outside select()'s Enumerable<int, string> type; PHP's runtime reads it anyway
                const selected = Reflect.apply(people.select, people, [
                    collect({ x: "first", y: "email" }),
                ]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-select-keyed-collection-arg"
                expect(selected.all()).toEqual([{ first: "T", email: "e" }]);
            });
        });
    });

    describe("pop", () => {
        it("takes a fractional count's whole items and every item for NAN, as PHP's loop over range() does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pop-fractional-and-non-finite-counts"
            const list = collect([1, 2, 3, 4]);

            expect(list.pop(2.5).all()).toEqual([4, 3]);
            expect(list.all()).toEqual([1, 2]);
            expect(list.keys().all()).toEqual([0, 1]);
            expect(list.values().all()).toEqual([1, 2]);

            const keyed = collect({ a: 1, b: 2, c: 3, d: 4 });

            expect(keyed.pop(2.5).all()).toEqual([4, 3]);
            expect(keyed.all()).toEqual({ a: 1, b: 2 });
            expect(keyed.keys().all()).toEqual(["a", "b"]);
            expect(keyed.values().all()).toEqual([1, 2]);

            for (const count of [NaN, Infinity, 1e19]) {
                const everything = collect([1, 2, 3, 4]);

                expect(everything.pop(count).all()).toEqual([4, 3, 2, 1]);
                expect(everything.all()).toEqual([]);
                expect(everything.keys().all()).toEqual([]);
                expect(everything.values().all()).toEqual([]);
            }
        });

        it("pops nothing for a count below 1 and throws range()'s ValueError for one between 1 and 2, unless fewer items cap it", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pop-fractional-and-non-finite-counts"
            const list = collect([1, 2, 3, 4]);
            const keyed = collect({ a: 1, b: 2, c: 3, d: 4 });

            expect(list.pop(0.5).all()).toEqual([]);
            expect(() => list.pop(1.5)).toThrow(
                "range(): Argument #3 ($step) must be less than the range spanned by argument #1 ($start) and argument #2 ($end)",
            );
            expect(list.all()).toEqual([1, 2, 3, 4]);
            expect(list.keys().all()).toEqual([0, 1, 2, 3]);
            expect(list.values().all()).toEqual([1, 2, 3, 4]);
            expect(() => keyed.pop(1.5)).toThrow(
                "range(): Argument #3 ($step) must be less than the range spanned by argument #1 ($start) and argument #2 ($end)",
            );
            expect(keyed.all()).toEqual({ a: 1, b: 2, c: 3, d: 4 });
            expect(keyed.keys().all()).toEqual(["a", "b", "c", "d"]);
            expect(keyed.values().all()).toEqual([1, 2, 3, 4]);

            const one = collect([9]);

            expect(one.pop(1.5).all()).toEqual([9]);
            expect(one.all()).toEqual([]);
            expect(collect([]).pop(1.5).all()).toEqual([]);
        });

        it("takes a fractional or NAN count in the order PHP's array holds integer keys out of order", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-shift-and-pop-counts-out-of-order-keys"
            const outOfOrder = () =>
                collect(
                    new Map([
                        [2, "c"],
                        [0, "a"],
                        [1, "b"],
                    ]),
                );
            const partly = outOfOrder();

            expect(partly.pop(2.5).all()).toEqual(["b", "a"]);
            expect(partly.all()).toEqual({ 2: "c" });
            expect(partly.keys().all()).toEqual([2]);
            expect(partly.values().all()).toEqual(["c"]);

            const refused = outOfOrder();

            expect(() => refused.pop(1.5)).toThrow(
                "range(): Argument #3 ($step) must be less than the range spanned by argument #1 ($start) and argument #2 ($end)",
            );
            expect(refused.keys().all()).toEqual([2, 0, 1]);
            expect(refused.values().all()).toEqual(["c", "a", "b"]);

            const everything = outOfOrder();

            expect(everything.pop(NaN).all()).toEqual(["b", "a", "c"]);
            expect(everything.keys().all()).toEqual([]);
            expect(everything.values().all()).toEqual([]);
        });

        describe("Laravel Tests", () => {
            it("test pop returns and removes last item in collection", () => {
                // CollectionTest::testPopReturnsAndRemovesLastItemInCollection
                const c = collect(["foo", "bar"]);

                expect(c.pop()).toBe("bar");
                expect(c.first()).toBe("foo");
            });

            it("test pop returns and removes last x items in collection", () => {
                // CollectionTest::testPopReturnsAndRemovesLastXItemsInCollection
                const c = collect(["foo", "bar", "baz"]);

                expect(c.pop(2).all()).toEqual(["baz", "bar"]);
                expect(c.first()).toBe("foo");

                const c2 = collect(["foo", "bar", "baz"]);
                expect(c2.pop(6).all()).toEqual(["baz", "bar", "foo"]);
            });
        });

        it("test pop with count < 1 returns empty collection", () => {
            const c = collect(["foo", "bar", "baz"]);
            expect(c.pop(0).all()).toEqual([]);
            expect(c.pop(-1).all()).toEqual([]);
            expect(c.all()).toEqual(["foo", "bar", "baz"]); // Original collection unchanged
        });

        it("hands back the value itself for a count of 1", () => {
            const collection = collect([1, 2, 3]);
            const returned = collection.pop(1);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pop-one-on-list-returns-value"
            expect({ returned, all: collection.all() }).toEqual({
                returned: 3,
                all: [1, 2],
            });
        });

        it("test pop with count === 1 on array returns single value", () => {
            const c = collect(["foo", "bar"]);
            expect(c.pop(1)).toBe("bar");
            expect(c.all()).toEqual(["foo"]);
        });

        it("test pop with count === 1 on empty array returns null", () => {
            const c = collect([]);
            expect(c.pop()).toBe(null);
            expect(c.pop(1)).toBe(null);
        });

        it("test pop with count === 1 on object returns single value", () => {
            const c = collect({ a: 1, b: 2, c: 3 });
            expect(c.pop()).toBe(3);
            expect(c.all()).toEqual({ a: 1, b: 2 });
        });

        it("test pop with count === 1 on empty object returns null", () => {
            const c = collect({});
            expect(c.pop()).toBe(null);
            expect(c.pop(1)).toBe(null);
            expect(c.all()).toEqual({});
        });

        it("test pop with count > 1 on empty collection returns empty collection", () => {
            const c1 = collect([]);
            expect(c1.pop(3).all()).toEqual([]);

            const c2 = collect({});
            expect(c2.pop(3).all()).toEqual([]);
        });

        it("test pop with count > 1 on array returns collection", () => {
            const c = collect(["a", "b", "c", "d"]);
            const result = c.pop(2);

            expect(result).toBeInstanceOf(Collection);
            expect(result.all()).toEqual(["d", "c"]);
            expect(c.all()).toEqual(["a", "b"]);
        });

        it("test pop with count > 1 on object returns collection", () => {
            const c = collect({ a: 1, b: 2, c: 3, d: 4 });
            const result = c.pop(2);

            expect(result).toBeInstanceOf(Collection);
            expect(result.all()).toEqual([4, 3]);
            expect(c.all()).toEqual({ a: 1, b: 2 });
        });

        it("test pop with count greater than collection size", () => {
            const c1 = collect(["a", "b"]);
            expect(c1.pop(5).all()).toEqual(["b", "a"]);
            expect(c1.all()).toEqual([]);

            const c2 = collect({ x: 10, y: 20 });
            expect(c2.pop(5).all()).toEqual([20, 10]);
            expect(c2.all()).toEqual({});
        });

        it("pops identically whether array- or object-backed", () => {
            const fromArray = new Collection([1, 2, 3]);
            const fromObject = new Collection({ a: 1, b: 2, c: 3 });
            expect(fromArray.pop()).toBe(3);
            expect(fromObject.pop()).toBe(3);
            expect(fromArray.count()).toBe(2);
            expect(fromObject.count()).toBe(2);
        });
    });

    describe("prepend", () => {
        it("casts its key the way PHP casts an array key on an object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "prepend-key-cast"
            expect(
                new Collection({ a: 1, 1: "x" }).prepend("v", 1.5).all(),
            ).toEqual({ 1: "v", a: 1 });
        });

        it("Laravel Tests", () => {
            // CollectionTest::testPrepend
            const c = collect(["one", "two", "three", "four"]);
            expect(c.prepend("zero").all()).toEqual([
                "zero",
                "one",
                "two",
                "three",
                "four",
            ]);

            const c2 = collect({ one: 1, two: 2 });
            expect(c2.prepend(0, "zero").all()).toEqual({
                zero: 0,
                one: 1,
                two: 2,
            });

            // docs/php-parity/task-23-obj-release-readiness.json, "prepend-null-key"
            const c3 = collect({ one: 1, two: 2 });
            expect(c3.prepend(0, null).all()).toEqual({
                "": 0,
                one: 1,
                two: 2,
            });

            // docs/php-parity/task-23-obj-release-readiness.json, "prepend-empty-key"
            const c4 = collect({ one: 1, two: 2 });
            expect(c4.prepend(0, "").all()).toEqual({
                "": 0,
                one: 1,
                two: 2,
            });
        });

        it("unshifts under key 0 when no key is given", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "prepend-assoc-no-key"
            expect(new Collection({ one: 1, two: 2 }).prepend(0).all()).toEqual(
                { 0: 0, one: 1, two: 2 },
            );
        });

        it("renumbers a negative integer key when no key is given", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "prepend-negative-int-key-no-key"
            expect(
                new Collection({ "-1": "a", x: "b" }).prepend("z").all(),
            ).toEqual({ 0: "z", 1: "a", x: "b" });
        });

        it("becomes object-backed when a list backing is given a key other than 0", () => {
            const zero = collect(["b", "c"]).prepend("a", 0);
            const string = collect(["b", "c"]).prepend("a", "k");
            const one = collect(["b", "c"]).prepend("a", 1);

            // docs/php-parity/task-23-obj-release-readiness.json, "prepend-list-with-key"
            expect(zero.all()).toEqual(["a", "c"]);
            expect(string.all()).toEqual({ k: "a", 0: "b", 1: "c" });
            expect(one.all()).toEqual({ 1: "a", 0: "b" });
            expect([zero.keys().all(), zero.values().all()]).toEqual([
                [0, 1],
                ["a", "c"],
            ]);
            expect([string.keys().all(), string.values().all()]).toEqual([
                ["k", 0, 1],
                ["a", "b", "c"],
            ]);
            expect([one.keys().all(), one.values().all()]).toEqual([
                [1, 0],
                ["a", "b"],
            ]);
        });

        it("leads with a key it prepends onto a list", () => {
            const collection = collect(["b", "c"]).prepend("a", "k");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-prepend-string-key-on-list-order"
            expect({
                values: collection.values().all(),
                keys: collection.keys().all(),
                first: collection.first(),
                last: collection.last(),
            }).toEqual({
                values: ["a", "b", "c"],
                keys: ["k", 0, 1],
                first: "a",
                last: "c",
            });
        });
    });

    describe("push", () => {
        describe("Laravel Tests", () => {
            it("test push with one item", () => {
                // CollectionTest::testPushWithOneItem
                const expected = [
                    4,
                    5,
                    6,
                    ["a", "b", "c"],
                    { who: "Jonny", preposition: "from", where: "Laroe" },
                    "Jonny from Laroe",
                ];

                const data = collect([4, 5, 6]);
                data.push(["a", "b", "c"]);
                data.push({
                    who: "Jonny",
                    preposition: "from",
                    where: "Laroe",
                });
                const actual = data.push("Jonny from Laroe").all();

                expect(actual).toEqual(expected);
            });

            it("test push with multiple items", () => {
                // CollectionTest::testPushWithMultipleItems
                const expected = [
                    4,
                    5,
                    6,
                    "Jonny",
                    "from",
                    "Laroe",
                    "Jonny",
                    "from",
                    "Laroe",
                    "a",
                    "b",
                    "c",
                ];

                const data = collect([4, 5, 6]);
                data.push("Jonny", "from", "Laroe");
                data.push("Jonny", "from", "Laroe");
                data.push(...collect(["a", "b", "c"]));
                const actual = data.push().all();

                expect(actual).toEqual(expected);
            });
        });

        it("test push function", () => {
            // Test pushing to empty array
            const c1 = collect([]);
            c1.push(1);
            expect(c1.all()).toEqual([1]);

            // Test pushing to empty object
            const c2 = collect({});
            c2.push("value");
            expect(c2.all()).toEqual({ 0: "value" });

            // Test pushing multiple values to object
            const c3 = collect({});
            c3.push("a", "b", "c");
            expect(c3.all()).toEqual({ 0: "a", 1: "b", 2: "c" });

            // Test pushing to object with existing numeric keys
            const c4 = collect({ 0: "first", 1: "second" });
            c4.push("third", "fourth");
            expect(c4.all()).toEqual({
                0: "first",
                1: "second",
                2: "third",
                3: "fourth",
            });

            // Test pushing to object with mixed keys
            const c5 = collect({ a: "value", 5: "item", b: "other" });
            c5.push("new");
            expect(c5.all()).toEqual({
                a: "value",
                5: "item",
                b: "other",
                6: "new",
            });

            // Test pushing to object with non-sequential numeric keys
            const c6 = collect({ 0: "a", 2: "b", 5: "c" });
            c6.push("d");
            expect(c6.all()).toEqual({ 0: "a", 2: "b", 5: "c", 6: "d" });

            // Test pushing no values (edge case)
            const c7 = collect([1, 2, 3]);
            c7.push();
            expect(c7.all()).toEqual([1, 2, 3]);

            // Test chaining
            const c8 = collect([1, 2]);
            const result = c8.push(3).push(4);
            expect(result).toBe(c8); // Should return same instance
            expect(c8.all()).toEqual([1, 2, 3, 4]);
        });

        it("reads the value pushed past a string key last", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-push-onto-string-keyed-last"
            expect(collect({ a: 1 }).push("z").last()).toBe("z");
        });

        it("keeps values pushed past a string key in the order they arrive", () => {
            const collection = collect({ a: 1 }).push("y", "z");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-push-many-onto-string-keyed"
            expect({
                keys: collection.keys().all(),
                values: collection.values().all(),
                last: collection.last(),
            }).toEqual({ keys: ["a", 0, 1], values: [1, "y", "z"], last: "z" });
        });

        it("keeps values pushed past a negative key in the order they arrive", () => {
            const collection = collect({ "-2": "a" }).push("p", "q", "r");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-push-many-past-negative-keys-order"
            expect({
                keys: collection.keys().all(),
                values: collection.values().all(),
                last: collection.last(),
            }).toEqual({
                keys: [-2, -1, 0, 1],
                values: ["a", "p", "q", "r"],
                last: "r",
            });
        });

        it("keeps values pushed onto a Map-built collection in the order they arrive", () => {
            const collection = collect(
                new Map<string | number, string>([
                    ["x", "a"],
                    [-2, "b"],
                ]),
            ).push("p", "q");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-push-many-onto-mixed-keys-order"
            expect({
                keys: collection.keys().all(),
                values: collection.values().all(),
                last: collection.last(),
            }).toEqual({
                keys: ["x", -2, -1, 0],
                values: ["a", "b", "p", "q"],
                last: "q",
            });
        });

        it("keeps values pushed across the last array index in the order they arrive", () => {
            const collection = collect({ 4294967293: "a", x: "b" }).push(
                "p",
                "q",
            );

            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-B-push-many-across-the-index-limit-order"
            expect({
                keys: collection.keys().all(),
                values: collection.values().all(),
                last: collection.last(),
            }).toEqual({
                keys: [4294967293, "x", 4294967294, 4294967295],
                values: ["a", "b", "p", "q"],
                last: "q",
            });
        });

        describe("push key classification", () => {
            // docs/php-parity/task-17-second-review.json, "push onto a {\"01\"}-keyed array"
            // docs/php-parity/task-17-second-review.json, "push onto a {\"1e2\"}-keyed array"
            // docs/php-parity/task-17-second-review.json, "push onto a {\"-1\"}-keyed array"
            // docs/php-parity/task-17-second-review.json, "push onto a {\"5\"}-keyed array"
            it.each([
                ["01", { "01": "v", 0: 9 }],
                ["1e2", { "1e2": "v", 0: 9 }],
                ["-1", { "-1": "v", 0: 9 }],
                ["5", { 5: "v", 6: 9 }],
            ])("classifies a %s key the way PHP does", (key, expected) => {
                expect(
                    new Collection({ [key]: "v" } as never)
                        .push(9 as never)
                        .all(),
                ).toEqual(expected);
            });

            it("classifies keys the same way unshift does", () => {
                // "5" and "-1" are excluded: PHP push keeps an integer key, unshift renumbers it
                // (docs/php-parity/task-23-obj-release-readiness.json, "unshift-negative-int-key").
                for (const key of ["01", "1e2", ""]) {
                    const pushed = Object.keys(
                        new Collection({ [key]: "v" } as never)
                            .push(9 as never)
                            .all(),
                    );
                    const unshifted = Object.keys(
                        new Collection({ [key]: "v" } as never)
                            .unshift(9 as never)
                            .all(),
                    );
                    expect(pushed.includes(key)).toBe(unshifted.includes(key));
                }
            });

            it("finds the true max key above the array-index range, not the last enumerated one", () => {
                // Above 2**32-2, Object.keys keeps insertion order instead of sorting ascending,
                // so the smaller key here is enumerated second - the naive "last one wins" reading
                // of key order would pick 5000000000 and collide with an existing 5000000001.
                const collection = new Collection({
                    "6000000000": "a",
                    "5000000000": "b",
                } as never);

                expect(collection.push("NEW" as never).all()).toEqual({
                    "6000000000": "a",
                    "5000000000": "b",
                    "6000000001": "NEW",
                });
            });
        });
    });

    describe("unshift", () => {
        it("keeps a Map backing's own key order, as PHP's array does", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "unshift-numeric-key-order"
            const data = new Collection(
                new Map([
                    [2, "c"],
                    [0, "a"],
                    [1, "b"],
                ]),
            );

            data.unshift("x");

            expect(data.all()).toEqual({ 0: "x", 1: "c", 2: "a", 3: "b" });
            expect(data.values().all()).toEqual(["x", "c", "a", "b"]);
            expect(data.keys().all()).toEqual([0, 1, 2, 3]);
        });

        it("renumbers a Map backing's integer keys when given no items", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "unshift-no-items-numeric-key-order"
            const data = new Collection(
                new Map([
                    [2, "c"],
                    [0, "a"],
                    [1, "b"],
                ]),
            );

            data.unshift();

            expect(data.all()).toEqual({ 0: "c", 1: "a", 2: "b" });
            expect(data.values().all()).toEqual(["c", "a", "b"]);
        });

        it("leaves a Map backing's string keys where they are", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "unshift-mixed-key-order"
            const data = new Collection(
                new Map<number | string, string>([
                    [2, "c"],
                    ["x", "v"],
                    [0, "a"],
                ]),
            );

            data.unshift("n");

            expect(data.all()).toEqual({ 0: "n", 1: "c", 2: "a", x: "v" });
            expect(data.values().all()).toEqual(["n", "c", "v", "a"]);
            expect(data.keys().all()).toEqual([0, 1, "x", 2]);
        });

        describe("Laravel Tests", () => {
            it("test unshift with one item", () => {
                // CollectionTest::testUnshiftWithOneItem
                const expected = [
                    "Jonny from Laroe",
                    { who: "Jonny", preposition: "from", where: "Laroe" },
                    ["a", "b", "c"],
                    4,
                    5,
                    6,
                ];

                const data = collect([4, 5, 6]);
                data.unshift(["a", "b", "c"]);
                data.unshift({
                    who: "Jonny",
                    preposition: "from",
                    where: "Laroe",
                });
                const actual = data.unshift("Jonny from Laroe").all();

                expect(actual).toEqual(expected);
            });

            it("test unshift with multiple items", () => {
                // CollectionTest::testUnshiftWithMultipleItems
                const expected = [
                    "a",
                    "b",
                    "c",
                    "Jonny",
                    "from",
                    "Laroe",
                    "Jonny",
                    "from",
                    "Laroe",
                    4,
                    5,
                    6,
                ];

                const data = collect([4, 5, 6]);
                data.unshift("Jonny", "from", "Laroe");
                data.unshift(
                    ...Object.values({ 11: "Jonny", 12: "from", 13: "Laroe" }),
                );
                data.unshift(...collect(["a", "b", "c"]));
                const actual = data.unshift(...[]).all();

                expect(actual).toEqual(expected);
            });
        });

        it("test unshift function", () => {
            // Test unshifting to empty array
            const c1 = collect([]);
            c1.unshift(1);
            expect(c1.all()).toEqual([1]);

            // Test unshifting to empty object
            const c2 = collect({});
            c2.unshift("value");
            expect(c2.all()).toEqual({ 0: "value" });

            // Test unshifting multiple values to object
            const c3 = collect({});
            c3.unshift("a", "b", "c");
            expect(c3.all()).toEqual({ 0: "a", 1: "b", 2: "c" });

            // Test unshifting to object with existing numeric keys
            const c4 = collect({ 0: "first", 1: "second" });
            c4.unshift("new");
            expect(c4.all()).toEqual({
                0: "new",
                1: "first",
                2: "second",
            });

            // Test unshifting to object with string keys only
            const c5 = collect({ a: "value", b: "other" });
            c5.unshift("new");
            expect(c5.all()).toEqual({
                0: "new",
                a: "value",
                b: "other",
            });

            // Test unshifting to object with mixed keys
            const c6 = collect({ a: "value", 5: "item", b: "other" });
            c6.unshift("new1", "new2");
            expect(c6.all()).toEqual({
                0: "new1",
                1: "new2",
                2: "item",
                a: "value",
                b: "other",
            });

            // Test unshifting to object with non-sequential numeric keys
            const c7 = collect({ 0: "a", 2: "b", 5: "c" });
            c7.unshift("x");
            expect(c7.all()).toEqual({
                0: "x",
                1: "a",
                2: "b",
                3: "c",
            });

            // Test unshifting no values (edge case)
            const c8 = collect([1, 2, 3]);
            c8.unshift();
            expect(c8.all()).toEqual([1, 2, 3]);

            // Test chaining
            const c9 = collect([3, 4]);
            const result = c9.unshift(2).unshift(1);
            expect(result).toBe(c9); // Should return same instance
            expect(c9.all()).toEqual([1, 2, 3, 4]);

            // Test object chaining
            const c10 = collect({ a: "value" });
            const result2 = c10.unshift("second").unshift("first");
            expect(result2).toBe(c10); // Should return same instance
            expect(c10.all()).toEqual({
                0: "first",
                1: "second",
                a: "value",
            });
        });

        it("leaves the caller's array untouched, as PHP's array is a value", () => {
            const original = [2, 3];
            const c = new Collection(original);
            c.unshift(1);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-construct-from-array-unshift-copies"
            expect([original, c.all()]).toEqual([
                [2, 3],
                [1, 2, 3],
            ]);
        });

        it("prepends an object item as one element, like array_unshift", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "D1 unshift assoc item onto assoc"
            expect(new Collection({ b: 2 }).unshift({ a: 1 }).all()).toEqual({
                0: { a: 1 },
                b: 2,
            });
        });

        it("leaves the caller's object untouched, as it leaves an array", () => {
            const original = { b: 2 };
            const c = new Collection(original);
            c.unshift(1);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-construct-from-record-unshift-copies"
            expect([original, c.all()]).toEqual([{ b: 2 }, { 0: 1, b: 2 }]);
            expect(c.keys().all()).toEqual([0, "b"]);
            expect(c.values().all()).toEqual([1, 2]);
        });

        it("classifies keys like PHP, keeping non-canonical numeric strings", () => {
            // PHP-verified: array_unshift only renumbers canonical integer keys.
            expect(
                new Collection({ "1.5": "a", x: "b" }).unshift(9).all(),
            ).toEqual({
                0: 9,
                "1.5": "a",
                x: "b",
            });
        });

        it("keeps an empty-string key instead of destroying it", () => {
            expect(new Collection({ "": "a" }).unshift(9).all()).toEqual({
                0: 9,
                "": "a",
            });
        });

        it("renumbers integer keys even with no items, like array_unshift", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "D1f unshift with no items on assoc"
            expect(new Collection({ 5: "a", x: "b" }).unshift().all()).toEqual({
                0: "a",
                x: "b",
            });
        });

        it("renumbers a negative integer key like any other integer key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "unshift-negative-int-key"
            expect(
                new Collection({ "-1": "a", x: "b" }).unshift("z").all(),
            ).toEqual({ 0: "z", 1: "a", x: "b" });
        });
    });

    describe("concat", () => {
        describe("Laravel Tests", () => {
            it("test concat with array", () => {
                // CollectionTest::testConcatWithArray
                const expected = [
                    4,
                    5,
                    6,
                    "a",
                    "b",
                    "c",
                    "Jonny",
                    "from",
                    "Laroe",
                    "Jonny",
                    "from",
                    "Laroe",
                ];

                let data = collect([4, 5, 6]);
                data = data.concat(["a", "b", "c"]);
                data = data.concat({
                    who: "Jonny",
                    preposition: "from",
                    where: "Laroe",
                });
                const actual = data
                    .concat({
                        who: "Jonny",
                        preposition: "from",
                        where: "Laroe",
                    })
                    .all();

                expect(actual).toEqual(expected);
            });

            it("test concat with collection", () => {
                // CollectionTest::testConcatWithCollection
                const expected = [
                    4,
                    5,
                    6,
                    "a",
                    "b",
                    "c",
                    "Jonny",
                    "from",
                    "Laroe",
                    "Jonny",
                    "from",
                    "Laroe",
                ];

                let firstCollection = collect([4, 5, 6]);
                const secondCollection = collect(["a", "b", "c"]);
                const thirdCollection = collect({
                    who: "Jonny",
                    preposition: "from",
                    where: "Laroe",
                });
                firstCollection = firstCollection.concat(secondCollection);
                firstCollection = firstCollection.concat(thirdCollection);
                const actual = firstCollection.concat(thirdCollection).all();

                expect(actual).toEqual(expected);
            });
        });

        it("appends a Map operand's values in the order it holds them", () => {
            const operand = () =>
                new Map([
                    [2, "c"],
                    [0, "a"],
                    [1, "b"],
                ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-concat-map-order"
            for (const concatenated of [
                collect(["x"]).concat(operand()),
                collect(["x"]).concat(collect(operand())),
            ]) {
                expect(concatenated.all()).toEqual(["x", "c", "a", "b"]);
                expect(concatenated.keys().all()).toEqual([0, 1, 2, 3]);
                expect(concatenated.values().all()).toEqual([
                    "x",
                    "c",
                    "a",
                    "b",
                ]);
            }
        });
    });

    describe("pull", () => {
        describe("Laravel Tests", () => {
            it("test pull retrieves item from collection", () => {
                // CollectionTest::testPullRetrievesItemFromCollection
                const c = collect(["foo", "bar"]);

                expect(c.pull(0)).toBe("foo");
                // PHP leaves "bar" at key 1; a list backing reindexes where PHP keeps a gap, so it is pulled from 0.
                expect(c.pull(0)).toBe("bar");

                const c2 = collect(["foo", "bar"]);

                expect(c2.pull(-1)).toBeNull();
                expect(c2.pull(2)).toBeNull();
            });

            it("test pull removes item from collection", () => {
                // CollectionTest::testPullRemovesItemFromCollection
                const c = collect(["foo", "bar"]);
                c.pull(0);
                // PHP leaves "bar" at key 1; a list backing reindexes where PHP keeps a gap, so it is pulled from 0.
                expect(c.all()).toEqual(["bar"]);
                c.pull(0);
                expect(c.all()).toEqual([]);
            });

            it("test pull removes item from nested collection", () => {
                // CollectionTest::testPullRemovesItemFromNestedCollection
                const nestedCollection = collect([
                    collect([
                        "value",
                        collect({
                            bar: "baz",
                            test: "value",
                        }),
                    ]),
                    "bar",
                ]);

                nestedCollection.pull("0.1.test");

                const actualArray = nestedCollection.toArray();
                const expectedArray = [["value", { bar: "baz" }], "bar"];

                expect(actualArray).toEqual(expectedArray);
            });

            it("test pull returns default", () => {
                // CollectionTest::testPullReturnsDefault
                const c = collect([]);
                const value = c.pull(0, "foo");
                expect(value).toBe("foo");
            });
        });

        it("test pull function comprehensive coverage", () => {
            const c = collect([1, 2, [3, 4, 5, [6, 7]]]);
            expect(c.pull("2.3.1")).toBe(7);

            // Test pulling from object with simple string key
            const c1 = collect({ a: "value1", b: "value2", c: "value3" });
            expect(c1.pull("b")).toBe("value2");
            expect(c1.all()).toEqual({ a: "value1", c: "value3" });

            // Test pulling from object with numeric key
            const c2 = collect({ 0: "first", 1: "second", 2: "third" });
            expect(c2.pull(1)).toBe("second");
            expect(c2.all()).toEqual({ 0: "first", 2: "third" });

            // Test pulling non-existent key from object
            const c3 = collect({ a: 1, b: 2 });
            expect(c3.pull("nonexistent")).toBeNull();
            expect(c3.all()).toEqual({ a: 1, b: 2 });

            // Test pulling with default value
            const c4 = collect({ a: 1 });
            expect(c4.pull("missing", "default")).toBe("default");

            // Test pulling with default value as function
            const c5 = collect({ x: "val" });
            expect(c5.pull("missing", () => "computed")).toBe("computed");

            // Test pulling from empty object
            const c6 = collect({});
            expect(c6.pull("any")).toBeNull();
            expect(c6.all()).toEqual({});

            // Test pulling nested path from object
            const c7 = collect({
                level1: {
                    level2: {
                        level3: "deep",
                    },
                },
            });
            expect(c7.pull("level1.level2.level3")).toBe("deep");
            expect(c7.all()).toEqual({ level1: { level2: {} } });

            // Test pulling with path that has non-object parent
            const c8 = collect({
                str: "string value",
                nested: { valid: "data" },
            });
            expect(c8.pull("str.invalid.path")).toBeNull();
            expect(c8.all()).toEqual({
                str: "string value",
                nested: { valid: "data" },
            });

            // A key the items hold is read and removed whole, dots and all, before any dot path, as Arr::exists
            // is asked first.
            const c8b = collect({
                "joe@example.com": "Joe",
                "jane@localhost": "Jane",
            });
            expect(c8b.pull("joe@example.com")).toBe("Joe");
            expect(c8b.all()).toEqual({ "jane@localhost": "Jane" });

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pull-string-index-on-list"
            // PHP keeps the gap ({0: 10, 2: 30}); a list backing reindexes, as a JS array holds no sparse keys.
            const c9 = collect([10, 20, 30]);
            expect(c9.pull(1)).toBe(20);
            expect(c9.all()).toEqual([10, 30]);

            // Test pulling from mixed object (string and numeric keys)
            const c10 = collect({
                name: "test",
                0: "zero",
                1: "one",
                other: "value",
            });
            expect(c10.pull(0)).toBe("zero");
            expect(c10.all()).toEqual({
                name: "test",
                1: "one",
                other: "value",
            });

            // Test pulling nested path from array
            const c11 = collect([
                { id: 1, data: "first" },
                { id: 2, data: "second" },
            ]);
            expect(c11.pull("1.data")).toBe("second");
            expect(c11.all()).toEqual([{ id: 1, data: "first" }, { id: 2 }]);

            // Test pulling with invalid numeric string key on array
            const c12 = collect([1, 2, 3]);
            expect(c12.pull("invalid")).toBeNull();

            // Test chaining after pull
            const c13 = collect({ a: 1, b: 2, c: 3 });
            c13.pull("a");
            c13.pull("c");
            expect(c13.all()).toEqual({ b: 2 });

            // Test pulling with path that starts invalid (no parent found)
            const c14 = collect({ a: 1 });
            expect(c14.pull("nonexistent.nested.path")).toBeNull();
            expect(c14.all()).toEqual({ a: 1 });

            // Test pulling from object - ensure all object branches are covered
            const c15 = collect({ x: "val", y: "other" });
            expect(c15.pull("y")).toBe("other");
            expect(c15.all()).toEqual({ x: "val" });

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pull-string-index-on-list"
            const c16 = collect(["a", "b", "c"]);
            expect(c16.pull("1")).toBe("b");
            expect(c16.all()).toEqual(["a", "c"]);
        });

        it("handles array with string numeric key", () => {
            const c = collect(["a", "b", "c"]);
            const returned = c.pull("1");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pull-string-index-on-list"
            // PHP keeps the gap ({0: "a", 2: "c"}); a list backing reindexes, as a JS array holds no sparse keys.
            expect({ returned, all: c.all(), count: c.count() }).toEqual({
                returned: "b",
                all: ["a", "c"],
                count: 2,
            });
            expect(c.keys().all()).toEqual([0, 1]);
            expect(c.values().all()).toEqual(["a", "c"]);
        });

        it("checks a float key as its string form, then reads and removes it as an integer key", () => {
            const list = collect(["a", "b", "c"]);
            const listReturned = list.pull(1.5);
            const record = collect({ "1.5": "x", 1: "y" });
            const recordReturned = record.pull(1.5);

            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-B-pull-float-key-exists-as-its-string-form"
            expect({
                list: { returned: listReturned, all: list.all() },
                record: { returned: recordReturned, all: record.all() },
            }).toEqual({
                list: { returned: null, all: ["a", "b", "c"] },
                record: { returned: "y", all: { "1.5": "x" } },
            });
        });

        it("keeps a list a list when the key is missing", () => {
            const c = collect(["foo", "bar"]);
            const returned = [c.pull(2), c.pull(-1)];

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pull-missing-on-list-keeps-list"
            expect({ returned, all: c.all(), json: c.toJson() }).toEqual({
                returned: [null, null],
                all: ["foo", "bar"],
                json: '["foo","bar"]',
            });
            expect(c.keys().all()).toEqual([0, 1]);
            expect(c.values().all()).toEqual(["foo", "bar"]);
        });

        it("hands back every item for a null key and removes nothing", () => {
            const c = collect([1, 2]);
            const returned = c.pull(null);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pull-null-key"
            expect({ returned, all: c.all() }).toEqual({
                returned: [1, 2],
                all: [1, 2],
            });

            // JS-only: the items come back copied, as PHP hands its array back by value
            expect(returned).not.toBe(c.all());
        });

        it("leaves the collections it holds as collections", () => {
            const c = collect({ a: collect([1]), b: 2 });
            c.pull("b");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pull-keeps-sibling-collections"
            expect(c.get("a")).toBeInstanceOf(Collection);
        });

        it("hands back a collection it holds as that collection", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pull-returns-stored-collection"
            expect(collect({ a: collect({ x: 1 }) }).pull("a")).toBeInstanceOf(
                Collection,
            );
        });

        it("pulls a dot path out of a collection it holds", () => {
            const c = collect({ a: collect({ x: 1, y: 2 }) });
            const returned = c.pull("a.x");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pull-dot-into-nested-collection"
            expect({
                returned,
                nestedIsCollection: c.get("a") instanceof Collection,
                toArray: c.toArray(),
            }).toEqual({
                returned: 1,
                nestedIsCollection: true,
                toArray: { a: { y: 2 } },
            });
        });

        it("reads a collection it holds one segment at a time, never by a literal dotted key", () => {
            const c = collect({ a: collect({ "x.y": 1 }) });
            const returned = c.pull("a.x.y");

            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-B-pull-dot-path-inside-collection-per-segment"
            expect({ returned, toArray: c.toArray() }).toEqual({
                returned: null,
                toArray: { a: { "x.y": 1 } },
            });
        });

        it("pulls through an array into a collection the array holds", () => {
            const c = collect({ a: { b: collect({ x: 1, y: 2 }) } });
            const returned = c.pull("a.b.x");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pull-through-array-into-collection"
            // toArray() leaves a collection an array holds as it is, so the row reads it as JSON encodes it.
            expect({
                returned,
                toArray: JSON.parse(JSON.stringify(c.toArray())),
            }).toEqual({
                returned: 1,
                toArray: { a: { b: { y: 2 } } },
            });

            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-B-pull-through-array-keeps-the-collection"
            expect(c.get("a")).toEqual({ b: expect.any(Collection) });
        });

        it("reads an array a held collection holds, but removes nothing from it", () => {
            const c = collect({ a: collect({ x: { y: 1, z: 2 } }) });
            const returned = c.pull("a.x.y");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pull-array-inside-collection-stays"
            expect({ returned, toArray: c.toArray() }).toEqual({
                returned: 1,
                toArray: { a: { x: { y: 1, z: 2 } } },
            });
        });

        it("pulls a dot path through a Map an item holds, as through the array it stands for", () => {
            const pulled = (
                items: Record<string, unknown>,
                key: string,
                defaultValue?: string,
            ) => {
                const c = collect(items);
                const returned = c.pull(key, defaultValue);
                const held = c.get("a") as Map<unknown, unknown>;

                return {
                    returned,
                    keys: [...held.keys()],
                    values: [...held.values()],
                };
            };

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pull-dot-path-through-nested-arrays"
            expect([
                pulled(
                    {
                        a: new Map([
                            ["b", 1],
                            ["c", 2],
                        ]),
                    },
                    "a.b",
                ),
                pulled({ a: new Map([["b", { c: 1, d: 2 }]]) }, "a.b.c"),
                pulled(
                    {
                        a: new Map([
                            [2, "x"],
                            [0, "y"],
                            [1, "z"],
                        ]),
                    },
                    "a.2",
                ),
                pulled({ a: new Map([["b", 1]]) }, "a.z", "d"),
            ]).toEqual([
                { returned: 1, keys: ["c"], values: [2] },
                { returned: 1, keys: ["b"], values: [{ d: 2 }] },
                { returned: "x", keys: [0, 1], values: ["y", "z"] },
                { returned: "d", keys: ["b"], values: [1] },
            ]);
        });

        it("changes a copy of a Map an item holds, and keeps the Map when nothing below it is pulled", () => {
            const held = new Map([["b", { c: 1 }]]);
            const c = collect({ a: held });

            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-B-pull-dot-path-missing-below-nested-array"
            expect(c.pull("a.b.z", "d")).toBe("d");
            expect(c.get("a")).toBe(held);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pull-dot-path-through-nested-arrays"
            expect(c.pull("a.b.c")).toBe(1);
            // JS-only: PHP's array is a value, so the change lands on a copy; the caller's own Map stays whole
            expect([...held.values()]).toEqual([{ c: 1 }]);
            expect(c.get("a")).toEqual(new Map([["b", {}]]));
        });

        it("ignores __proto__ as final segment in nested pull path", () => {
            // JS-only: a path segment is an own key, so "__proto__" never reaches Object.prototype
            const c = collect({ a: { b: "value" } });
            c.pull("a.__proto__");
            expect(({} as Record<string, unknown>)["__proto__"]).toBeDefined(); // Object.prototype untouched
            expect(c.all()).toEqual({ a: { b: "value" } });
        });

        it("ignores __proto__ as mid-path segment in nested pull path", () => {
            // JS-only: a path segment is an own key, so "__proto__" never reaches Object.prototype
            const c = collect({ a: { b: "value" } });
            c.pull("__proto__.polluted");
            expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
            expect(c.all()).toEqual({ a: { b: "value" } });
        });
    });

    describe("put", () => {
        describe("Laravel Tests", () => {
            it("test put", () => {
                // CollectionTest::testPut
                const data = collect({ name: "taylor", email: "foo" });
                data.put("name", "dayle");
                expect(data.all()).toEqual({ name: "dayle", email: "foo" });
                expect(data.keys().all()).toEqual(["name", "email"]);
                expect(data.values().all()).toEqual(["dayle", "foo"]);
            });

            it("test put with no key", () => {
                // CollectionTest::testPutWithNoKey
                const data = collect(["taylor", "shawn"]);
                data.put(null, "dayle");
                expect(data.all()).toEqual(["taylor", "shawn", "dayle"]);
            });

            it("test put add item to collection", () => {
                // CollectionTest::testPutAddsItemToCollection
                const data = new Collection();
                expect(data.toArray()).toEqual([]);
                data.put("foo", 1);
                expect(data.toArray()).toEqual({ foo: 1 });
                data.put("bar", { nested: "two" });
                expect(data.toArray()).toEqual({
                    foo: 1,
                    bar: { nested: "two" },
                });
                data.put("foo", 3);
                expect(data.toArray()).toEqual({
                    foo: 3,
                    bar: { nested: "two" },
                });
            });
        });

        it('keeps a "length" key as data on a list backing', () => {
            const collection = new Collection([1, 2]);
            collection.put("length", 0);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-put-length-zero-on-list"
            expect({
                all: collection.all(),
                count: collection.count(),
                keys: collection.keys().all(),
                values: collection.values().all(),
                get: collection.get("length"),
                has: collection.has("length"),
                last: collection.last(),
            }).toEqual({
                all: { 0: 1, 1: 2, length: 0 },
                count: 3,
                keys: [0, 1, "length"],
                values: [1, 2, 0],
                get: 0,
                has: true,
                last: 0,
            });
        });

        it.fails("keeps an integer key put after a string key last", () => {
            const collection = collect({ a: 1 }).put(0, "z");

            // Ordered-backing gap: PHP keeps a key put past the string keys last, 0 after a
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-put-int-key-onto-string-keyed-order"
            expect({
                keys: collection.keys().all(),
                values: collection.values().all(),
                last: collection.last(),
            }).toEqual({ keys: ["a", 0], values: [1, "z"], last: "z" });
        });

        // docs/php-parity/task-17-second-review.json: "Arr::set writes a
        // \"constructor\" key", "...a \"prototype\" key", "...a \"__proto__\" key" —
        // the reference behaviour path.ts's writes were brought in line with.
        describe("unsafe-key write policy", () => {
            afterEach(() => {
                expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
                expect(Object.getPrototypeOf({})).toBe(Object.prototype);
            });

            it.each(["constructor", "prototype", "__proto__"])(
                "keeps a %s key as own data",
                (key) => {
                    expect(
                        new Collection({}).put(key as never, 5 as never).all(),
                    ).toEqual({ [key]: 5 });
                },
            );
        });
    });

    describe("random", () => {
        describe("Laravel Tests", () => {
            it("test random", () => {
                // CollectionTest::testRandom
                const data = collect([1, 2, 3, 4, 5, 6]);
                const random = data.random();
                expect(typeof random).toBe("number");
                expect(data.all()).toContain(random);

                const randomMultiple = data.random(0);
                expect(randomMultiple).toBeInstanceOf(Collection);
                expect(randomMultiple.count()).toBe(0);

                const randomSingle = data.random(1);
                expect(randomSingle).toBeInstanceOf(Collection);
                expect(randomSingle.count()).toBe(1);

                const randomDouble = data.random(2);
                expect(randomDouble).toBeInstanceOf(Collection);
                expect(randomDouble.count()).toBe(2);

                const randomStringZero = data.random("0");
                expect(randomStringZero).toBeInstanceOf(Collection);
                expect(randomStringZero.count()).toBe(0);

                const randomStringOne = data.random("1");
                expect(randomStringOne).toBeInstanceOf(Collection);
                expect(randomStringOne.count()).toBe(1);

                const randomStringTwo = data.random("2");
                expect(randomStringTwo).toBeInstanceOf(Collection);
                expect(randomStringTwo.count()).toBe(2);

                const randomWithRepetition = data.random(2, true);
                expect(randomWithRepetition).toBeInstanceOf(Collection);
                expect(randomWithRepetition.count()).toBe(2);
                // When preserveKeys is true, result can be an object with numeric keys
                const randomAll = randomWithRepetition.all();
                const dataAll = data.all();
                if (Array.isArray(randomAll)) {
                    const intersection = randomAll.filter((value) =>
                        (dataAll as number[]).includes(value),
                    );
                    expect(intersection.length).toBe(2);
                } else {
                    // For objects, check if all keys and values match
                    let matchCount = 0;
                    for (const [key, value] of Object.entries(randomAll)) {
                        if (Array.isArray(dataAll)) {
                            if (dataAll[Number(key)] === value) {
                                matchCount++;
                            }
                        } else {
                            if (
                                (dataAll as Record<string, unknown>)[key] ===
                                value
                            ) {
                                matchCount++;
                            }
                        }
                    }
                    expect(matchCount).toBe(2);
                }

                const randomCallback = data.random((items) =>
                    Math.min(10, items.count()),
                );
                expect(randomCallback).toBeInstanceOf(Collection);
                expect(randomCallback.count()).toBe(6);

                const randomCallbackWithRepetition = data.random(
                    (items) => Math.min(10, items.count() - 1),
                    true,
                );
                expect(randomCallbackWithRepetition).toBeInstanceOf(Collection);
                expect(randomCallbackWithRepetition.count()).toBe(5);
                // When preserveKeys is true, result can be an object with numeric keys
                const randomAll2 = randomCallbackWithRepetition.all();
                const dataAll2 = data.all();
                if (Array.isArray(randomAll2)) {
                    const intersection2 = randomAll2.filter((value) =>
                        (dataAll2 as number[]).includes(value),
                    );
                    expect(intersection2.length).toBe(5);
                } else {
                    // For objects, check if all keys and values match
                    let matchCount = 0;
                    for (const [key, value] of Object.entries(randomAll2)) {
                        if (Array.isArray(dataAll2)) {
                            if (dataAll2[Number(key)] === value) {
                                matchCount++;
                            }
                        } else {
                            if (
                                (dataAll2 as Record<string, unknown>)[key] ===
                                value
                            ) {
                                matchCount++;
                            }
                        }
                    }
                    expect(matchCount).toBe(5);
                }
            });

            it("test random on empty collection", () => {
                // CollectionTest::testRandomOnEmptyCollection
                const data = collect([]);
                const random = data.random(0);
                expect(random).toBeInstanceOf(Collection);
                expect(random.count()).toBe(0);

                const randomStringZero = data.random("0");
                expect(randomStringZero).toBeInstanceOf(Collection);
                expect(randomStringZero.count()).toBe(0);
            });

            it("test random on empty collection with no count throws", () => {
                // docs/php-parity/task-08-arr-parity.json, "Arr::random on empty", the call random() makes
                expect(() => collect([]).random()).toThrowError(
                    InvalidArgumentException,
                );
                expect(() => collect([]).random()).toThrowError(
                    "You requested 1 items, but there are only 0 items available.",
                );
            });

            it("test random throws an exception using amount bigger than collection size", () => {
                // CollectionTest::testRandomThrowsAnExceptionUsingAmountBiggerThanCollectionSize
                const data = collect([1, 2, 3]);
                expect(() => {
                    data.random(4);
                }).toThrowError(InvalidArgumentException);
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-random-too-many-count"
                expect(() => {
                    data.random(4);
                }).toThrowError(
                    "You requested 4 items, but there are only 3 items available.",
                );
            });
        });

        it("hands a count callback the collection and takes the count it answers", () => {
            const collection = collect([1, 2, 3]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-random-callable-count"
            expect(
                collection
                    .random((items) => (items instanceof Collection ? 2 : 0))
                    .count(),
            ).toBe(2);
            expect(collection.random(() => 0).all()).toEqual([]);
            expect(() => collection.random(() => 5)).toThrowError(
                InvalidArgumentException,
            );
            expect(() => collection.random(() => 5)).toThrowError(
                "You requested 5 items, but there are only 3 items available.",
            );
        });

        it("truncates a fractional count, as Arr::random's int cast does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-random-float-count"
            expect([
                collect([1, 2, 3]).random(1.2).count(),
                collect([1, 2, 3]).random(2.9).count(),
            ]).toEqual([1, 2]);
        });

        it("picks nothing for a negative count", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-random-negative-count"
            expect(collect([1, 2, 3]).random(-1).all()).toEqual([]);
        });

        it("names an infinite count INF, as PHP prints it, and picks nothing for -INF", () => {
            const collection = collect([1, 2, 3]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-random-non-finite-count"
            expect(() => collection.random(Infinity)).toThrowError(
                InvalidArgumentException,
            );
            expect(() => collection.random(Infinity)).toThrowError(
                "You requested INF items, but there are only 3 items available.",
            );
            expect(collection.random(-Infinity).all()).toEqual([]);
        });

        it("compares a count that is not numeric as a string, as PHP does", () => {
            const collection = collect([1, 2, 3]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-random-non-numeric-string-count"
            expect(() => collection.random("abc")).toThrowError(
                InvalidArgumentException,
            );
            expect(() => collection.random("abc")).toThrowError(
                "You requested abc items, but there are only 3 items available.",
            );
        });

        it("rejects a NAN count or a string that is not numeric, as pickArrayKeys' int parameter does", () => {
            const collection = collect([1, 2, 3]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-random-non-finite-count"
            expect(() => collection.random(NaN)).toThrowError(TypeError);
            expect(() => collection.random(NaN)).toThrowError(
                "Random\\Randomizer::pickArrayKeys(): Argument #2 ($num) must be of type int, float given",
            );
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-random-non-numeric-string-count"
            expect(() => collection.random("1x")).toThrowError(TypeError);
            expect(() => collection.random("1x")).toThrowError(
                "Random\\Randomizer::pickArrayKeys(): Argument #2 ($num) must be of type int, string given",
            );
        });

        it("picks nothing from an empty collection at a NAN count, as Arr::random's empty guard answers first", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-random-nan-count-on-empty"
            expect(collect([]).random(NaN).all()).toEqual([]);
            expect(
                collect([])
                    .random(() => NaN)
                    .all(),
            ).toEqual([]);
        });

        it("reindexes from zero by default into a list, either backing", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-random-record-count-is-list"
            for (const picked of [
                collect([10, 20, 30]).random(2),
                collect({ one: 10, two: 20, three: 30 }).random(2),
            ]) {
                expect(picked).toBeInstanceOf(Collection);
                expect(Array.isArray(picked.all())).toBe(true);
                expect(picked.keys().all()).toEqual([0, 1]);
            }
            expect(collect({ a: 1 }).random(0).all()).toEqual([]);
            // Same row: kept keys that run 0..n-1 in order make a list too.
            expect(
                Array.isArray(collect([10, 20, 30]).random(3, true).all()),
            ).toBe(true);
        });

        it("keeps string keys when asked to", () => {
            const data = collect({ a: 1, b: 2, c: 3 });
            const picked = data.random(3, true);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-random-preserved-string-keys"
            expect(picked.all()).toEqual({ a: 1, b: 2, c: 3 });
            expect(picked.keys().all()).toEqual(["a", "b", "c"]);
            expect(picked.values().all()).toEqual([1, 2, 3]);
            expect(Array.isArray(data.random(2, true).all())).toBe(false);
        });

        it.fails(
            "picks a Map-built collection whole in its insertion order",
            () => {
                const kept = outOfOrderKeys().random(3, true);

                // Ordered-backing gap: PHP picks in insertion order, c before a and b, and keeps the keys 2, 0, 1
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-random-out-of-order-full-count"
                expect([
                    outOfOrderKeys().random(3).all(),
                    kept.keys().all(),
                    kept.values().all(),
                ]).toEqual([
                    ["c", "a", "b"],
                    [2, 0, 1],
                    ["c", "a", "b"],
                ]);
            },
        );
    });

    describe("replace", () => {
        it("becomes object-backed when a replacer leaves its list keys other than 0..n-1", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "replace-list-keyed-replacer"
            expect(
                collect(["a", "b", "c"]).replace({ 1: "x", k: "y" }).all(),
            ).toEqual({ 0: "a", 1: "x", 2: "c", k: "y" });
            expect(collect(["a"]).replace({ 3: "x" }).all()).toEqual({
                0: "a",
                3: "x",
            });
        });

        describe("Laravel Tests", () => {
            it("test replace null", () => {
                // CollectionTest::testReplaceNull
                const c = collect(["a", "b", "c"]);
                expect(c.replace(null).all()).toEqual(["a", "b", "c"]);
            });

            it("test replace array", () => {
                // CollectionTest::testReplaceArray
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-replace-sparse-int-keyed-replacer"
                const c = collect(["a", "b", "c"]);
                expect(c.replace({ 1: "d", 2: "e" }).all()).toEqual([
                    "a",
                    "d",
                    "e",
                ]);

                const c2 = collect(["a", "b", "c"]);
                expect(
                    c2.replace({ 1: "d", 2: "e", 3: "f", 4: "g" }).all(),
                ).toEqual(["a", "d", "e", "f", "g"]);

                const c3 = collect({ name: "amir", family: "otwell" });
                expect(c3.replace({ name: "taylor", age: 26 }).all()).toEqual({
                    name: "taylor",
                    family: "otwell",
                    age: 26,
                });
            });

            it("test replace collection", () => {
                // CollectionTest::testReplaceCollection
                const c = collect(["a", "b", "c"]);
                expect(c.replace(collect({ 1: "d", 2: "e" })).all()).toEqual([
                    "a",
                    "d",
                    "e",
                ]);

                const c2 = collect(["a", "b", "c"]);
                expect(
                    c2
                        .replace(collect({ 1: "d", 2: "e", 3: "f", 4: "g" }))
                        .all(),
                ).toEqual(["a", "d", "e", "f", "g"]);

                // docs/php-parity/task-23-obj-release-readiness.json, "C16 replace assoc":
                // the same replacer as an array, so the same keys in the same order
                const c3 = collect({ name: "amir", family: "otwell" });
                const replaced = c3.replace(
                    collect({ name: "taylor", age: 26 }),
                );

                expect(replaced.all()).toEqual({
                    name: "taylor",
                    family: "otwell",
                    age: 26,
                });
                expect(replaced.keys().all()).toEqual([
                    "name",
                    "family",
                    "age",
                ]);
                expect(replaced.values().all()).toEqual([
                    "taylor",
                    "otwell",
                    26,
                ]);
            });
        });

        it("replaces without mutating, either backing", () => {
            // Collection.php:1185 ends in newInstance(...), so neither the array-backed
            // nor the object-backed source collection's items may change.
            const fromArray = new Collection([1, 2]);
            const fromObject = new Collection({ a: 1, b: 2 });
            fromArray.replace([9]);
            fromObject.replace({ a: 9 });
            expect(fromArray.all()).toEqual([1, 2]);
            expect(fromObject.all()).toEqual({ a: 1, b: 2 });
        });

        it("treats a null replacer as a no-op, either backing", () => {
            // getRawItems(null) always returns [], so an object-backed collection was
            // being asked to replace against an array and dataReplace's same-type guard
            // threw.
            const fromArray = new Collection([1, 2, 3]);
            const fromObject = new Collection({ a: 1, b: 2 });
            expect(fromArray.replace(null).all()).toEqual([1, 2, 3]);
            expect(fromObject.replace(null).all()).toEqual({ a: 1, b: 2 });
        });

        it("replaces an object backing's integer keys from a list", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "replace-list-replacer"
            expect(collect({ a: 1 }).replace(["x"]).all()).toEqual({
                a: 1,
                0: "x",
            });
        });

        it("keeps the receiver's keys first, then those the replacer adds", () => {
            const replaced = collect({ a: 1 }).replace(["x"]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-replace-assoc-then-list"
            expect(replaced.all()).toEqual({ a: 1, 0: "x" });
            expect(replaced.keys().all()).toEqual(["a", 0]);
            expect(replaced.values().all()).toEqual([1, "x"]);
        });

        it("adds a replacer's keys in the order it holds them", () => {
            const replaced = collect([1, 2, 3]).replace(
                new Map([
                    [7, "x"],
                    [3, "y"],
                ]),
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-replace-out-of-order-int-keys"
            expect(replaced.all()).toEqual({
                0: 1,
                1: 2,
                2: 3,
                7: "x",
                3: "y",
            });
            expect(replaced.keys().all()).toEqual([0, 1, 2, 7, 3]);
            expect(replaced.values().all()).toEqual([1, 2, 3, "x", "y"]);
        });

        it("keeps a Map-built receiver's keys in the order it holds them", () => {
            const replaced = outOfOrderKeys().replace({ 1: "B", 5: "f" });

            // docs/php-parity/task-30-map-order.json, "replace-out-of-order"
            expect(replaced.all()).toEqual({ 0: "a", 1: "B", 2: "c", 5: "f" });
            expect(replaced.keys().all()).toEqual([2, 0, 1, 5]);
            expect(replaced.values().all()).toEqual(["c", "a", "B", "f"]);
        });

        it("reads a plain object's all member as one of its entries, never unwrapping it", () => {
            const operand = { all: () => ({ b: 2 }) };
            const result = collect({ a: 1 }).replace(operand as never);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-plain-object-all-member-is-data"
            expect(result.all()).toEqual({ a: 1, all: operand.all });
            expect(result.keys().all()).toEqual(["a", "all"]);
            expect(result.values().all()).toEqual([1, operand.all]);
        });
    });

    describe("replaceRecursive", () => {
        it("becomes object-backed when a replacer leaves its list keys other than 0..n-1", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "replace-list-keyed-replacer"
            expect(
                collect(["a", "b", "c"])
                    .replaceRecursive({ 1: "x", k: "y" })
                    .all(),
            ).toEqual({ 0: "a", 1: "x", 2: "c", k: "y" });
        });

        describe("Laravel Tests", () => {
            it("test replace recursive null", () => {
                // CollectionTest::testReplaceRecursiveNull
                const c = collect(["a", "b", ["c", "d"]]);
                expect(c.replaceRecursive(null).all()).toEqual([
                    "a",
                    "b",
                    ["c", "d"],
                ]);
            });

            it("test replace recursive array", () => {
                // CollectionTest::testReplaceRecursiveArray
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-replaceRecursive-sparse-replacer"
                const c = collect(["a", "b", ["c", "d"]]);
                expect(
                    c.replaceRecursive({ 0: "z", 2: { 1: "e" } }).all(),
                ).toEqual(["z", "b", ["c", "e"]]);

                const c2 = collect(["a", "b", ["c", "d"]]);
                expect(
                    c2
                        .replaceRecursive({ 0: "z", 2: { 1: "e" }, 3: "f" })
                        .all(),
                ).toEqual(["z", "b", ["c", "e"], "f"]);
            });

            it("test replace recursive collection", () => {
                // CollectionTest::testReplaceRecursiveCollection
                const c = collect(["a", "b", ["c", "d"]]);
                expect(
                    c
                        .replaceRecursive(collect({ 0: "z", 2: { 1: "e" } }))
                        .all(),
                ).toEqual(["z", "b", ["c", "e"]]);
            });
        });

        it("replaces without mutating, either backing", () => {
            // Same rationale as replace's "either backing" test above. Array-backed
            // values pinned by docs/php-parity/task-05-replace.json "replaceRecursive
            // array nested"; object-backed by "replaceRecursive nested".
            const fromArray = new Collection([{ x: 1 }, 2]);
            const fromObject = new Collection({ a: { x: 1 }, b: 2 });
            fromArray.replaceRecursive([{ y: 2 }]);
            fromObject.replaceRecursive({ a: { y: 2 } });
            expect(fromArray.all()).toEqual([{ x: 1 }, 2]);
            expect(fromObject.all()).toEqual({ a: { x: 1 }, b: 2 });
        });

        it("treats a null replacer as a no-op, either backing", () => {
            // Same rationale as replace's null pin above.
            const fromArray = new Collection([1]);
            const fromObject = new Collection({ a: 1 });
            expect(fromArray.replaceRecursive(null).all()).toEqual([1]);
            expect(fromObject.replaceRecursive(null).all()).toEqual({ a: 1 });
        });

        it("merges a nested list with a nested object by key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "D7 replaceRecursive nested list replaced by offset map"
            expect(
                collect({ k: ["c", "d"] })
                    .replaceRecursive({ k: { 1: "e" } })
                    .all(),
            ).toEqual({ k: ["c", "e"] });
        });

        it("replaces an object backing's integer keys from a list", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "object-backing-list-operand"
            expect(
                collect({ 0: "a", 1: "b", x: "c" })
                    .replaceRecursive(["z"])
                    .all(),
            ).toEqual({ 0: "z", 1: "b", x: "c" });
        });

        it("keeps the receiver's keys first, then those the replacer adds", () => {
            const replaced = collect({ a: 1 }).replaceRecursive(["x"]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-replaceRecursive-assoc-then-list"
            expect(replaced.all()).toEqual({ a: 1, 0: "x" });
            expect(replaced.keys().all()).toEqual(["a", 0]);
            expect(replaced.values().all()).toEqual([1, "x"]);
        });

        it("adds a replacer's keys in the order it holds them", () => {
            const replaced = collect(["a"]).replaceRecursive(
                new Map([
                    [2, "c"],
                    [1, "b"],
                ]),
            );

            // docs/php-parity/task-30-map-order.json, "replaceRecursive-list-out-of-order-operand"
            expect(replaced.all()).toEqual({ 0: "a", 1: "b", 2: "c" });
            expect(replaced.keys().all()).toEqual([0, 2, 1]);
            expect(replaced.values().all()).toEqual(["a", "c", "b"]);
        });

        it("reads a plain object's all member as one of its entries, never unwrapping it", () => {
            const operand = { all: () => ({ b: 2 }) };
            const result = collect({ a: 1 }).replaceRecursive(operand as never);

            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-F-plain-object-all-member-is-data-by-value"
            expect(result.all()).toEqual({ a: 1, all: operand.all });
            expect(result.keys().all()).toEqual(["a", "all"]);
            expect(result.values().all()).toEqual([1, operand.all]);
        });
    });

    describe("reverse", () => {
        describe("Laravel Tests", () => {
            it("test reverse", () => {
                // CollectionTest::testReverse
                const data = collect(["zaeed", "alan"]);
                const reversed = data.reverse();

                // JS-only: a list cannot hold its keys reversed, so they are renumbered, where PHP keeps 1 then 0
                expect(reversed.all()).toEqual(["alan", "zaeed"]);

                const data2 = collect({ name: "taylor", framework: "laravel" });
                const reversed2 = data2.reverse();

                expect(reversed2.all()).toEqual({
                    framework: "laravel",
                    name: "taylor",
                });
                expect(reversed2.keys().all()).toEqual(["framework", "name"]);
            });
        });

        it.fails(
            "reverses a Map-built collection in the order it holds its items",
            () => {
                const reversed = outOfOrderKeys().reverse();

                // Ordered-backing gap: PHP reverses 2 => c, 0 => a, 1 => b into 1 => b, 0 => a, 2 => c
                // docs/php-parity/task-30-map-order.json, "reverse-out-of-order"
                expect([
                    reversed.keys().all(),
                    reversed.values().all(),
                ]).toEqual([
                    [1, 0, 2],
                    ["b", "a", "c"],
                ]);
            },
        );
    });

    describe("search", () => {
        describe("Laravel Tests", () => {
            it("test search returns index of first found item", () => {
                // CollectionTest::testSearchReturnsIndexOfFirstFoundItem
                const c = collect({
                    0: 1,
                    1: 2,
                    2: 3,
                    3: 4,
                    4: 5,
                    5: 2,
                    6: 5,
                    foo: "bar",
                });

                expect(c.search(2)).toBe(1);
                expect(c.search("2")).toBe(1);
                expect(c.search("bar")).toBe("foo");
                expect(
                    c.search((value) => {
                        // @ts-expect-error - operator > on string | number union
                        return value > 4;
                    }),
                ).toBe(4);
                expect(
                    c.search((value) => {
                        return typeof value === "string";
                    }),
                ).toBe("foo");
            });

            it("test search in strict mode", () => {
                // CollectionTest::testSearchInStrictMode
                const c = collect([false, 0, 1, [], ""]);

                expect(c.search("false", true)).toBe(false);
                expect(c.search("1", true)).toBe(false);
                expect(c.search(false, true)).toBe(0);
                expect(c.search(0, true)).toBe(1);
                expect(c.search(1, true)).toBe(2);
                expect(c.search([], true)).toBe(3);
                expect(c.search("", true)).toBe(4);
            });

            it("test search returns false when item is not found", () => {
                // CollectionTest::testSearchReturnsFalseWhenItemIsNotFound
                const c = collect({
                    0: 1,
                    1: 2,
                    2: 3,
                    3: 4,
                    4: 5,
                    foo: "bar",
                });

                expect(c.search(6)).toBe(false);
                expect(c.search("foo")).toBe(false);
                expect(
                    c.search((value) => {
                        // @ts-expect-error - operator < on string | number union
                        return value < 1 && typeof value === "number";
                    }),
                ).toBe(false);
                expect(
                    c.search((value) => {
                        return value === "nope";
                    }),
                ).toBe(false);
            });
        });

        it("answers a numeric-string record key as the integer PHP stores it as", () => {
            const key = collect({ 1: "a", x: "b" }).search("a");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-search-numeric-string-record-key":
            // PHP's gettype() says integer where typeof says number
            expect([typeof key, key]).toEqual(["number", 1]);
        });

        it.fails(
            "finds the first key holding a value in a Map-built collection's insertion order",
            () => {
                const duplicates = collect(
                    new Map([
                        [2, "x"],
                        [0, "x"],
                        [1, "y"],
                    ]),
                );

                // Ordered-backing gap: PHP searches in insertion order, so key 2 comes before 0
                // docs/php-parity/task-30-map-order.json, "search-out-of-order-duplicate-value"
                expect(duplicates.search("x")).toBe(2);
            },
        );

        it.fails(
            "calls a callback in a Map-built collection's insertion order",
            () => {
                const seen: number[] = [];
                outOfOrderKeys().search((_value, key) => {
                    seen.push(key);

                    return false;
                });

                // Ordered-backing gap: PHP calls the callback in insertion order, key 2 before 0 and 1
                // docs/php-parity/task-30-map-order.json, "search-out-of-order-callback-order"
                expect(seen).toEqual([2, 0, 1]);
            },
        );
    });

    describe("before", () => {
        describe("Laravel Tests", () => {
            it("test before returns item before the given item", () => {
                // CollectionTest::testBeforeReturnsItemBeforeTheGivenItem
                const c = collect({
                    0: 1,
                    1: 2,
                    2: 3,
                    3: 4,
                    4: 5,
                    5: 2,
                    6: 5,
                    name: "taylor",
                    framework: "laravel",
                });

                expect(c.before(2)).toBe(1);
                expect(c.before("2")).toBe(1);
                expect(c.before("taylor")).toBe(5);
                expect(c.before("laravel")).toBe("taylor");
                expect(
                    c.before((value) => {
                        // @ts-expect-error - operator > on string | number union
                        return value > 4;
                    }),
                ).toBe(4);
                expect(
                    c.before((value) => {
                        return typeof value === "string";
                    }),
                ).toBe(5);
            });

            it("test before in strict mode", () => {
                // CollectionTest::testBeforeInStrictMode
                const emptyArray: unknown[] = [];
                const c = collect([false, 0, 1, emptyArray, ""]);

                expect(c.before("false", true)).toBeNull();
                expect(c.before("1", true)).toBeNull();
                expect(c.before(false, true)).toBeNull();
                expect(c.before(0, true)).toBe(false);
                expect(c.before(1, true)).toBe(0);
                expect(c.before(emptyArray, true)).toBe(1);
                expect(c.before("", true)).toBe(emptyArray);
            });

            it("test before returns null when item is not found", () => {
                // CollectionTest::testBeforeReturnsNullWhenItemIsNotFound
                const c = collect({
                    0: 1,
                    1: 2,
                    2: 3,
                    3: 4,
                    4: 5,
                    foo: "bar",
                });

                expect(c.before(6)).toBeNull();
                expect(c.before("foo")).toBeNull();
                expect(
                    c.before((value) => {
                        // @ts-expect-error - operator < on string | number union
                        return value < 1 && typeof value === "number";
                    }),
                ).toBeNull();
                expect(
                    c.before((value) => {
                        return value === "nope";
                    }),
                ).toBeNull();
            });

            it("test before returns null when item on the first item", () => {
                // CollectionTest::testBeforeReturnsNullWhenItemOnTheFirstitem
                const c = collect({
                    0: 1,
                    1: 2,
                    2: 3,
                    3: 4,
                    4: 5,
                    foo: "bar",
                });

                expect(c.before(1)).toBeNull();
                expect(
                    c.before((value) => {
                        // @ts-expect-error - operator < on string | number union
                        return value < 2 && typeof value === "number";
                    }),
                ).toBeNull();
            });
        });

        it.fails(
            "finds nothing before the item a leading string key holds",
            () => {
                // Ordered-backing gap: PHP keeps the string key foo first, so nothing comes before bar
                // CollectionTest::testBeforeReturnsNullWhenItemOnTheFirstitem
                expect(stringKeyFirst().before("bar")).toBeNull();
            },
        );

        it.fails(
            "finds a leading string key's item before the first integer key's",
            () => {
                // Ordered-backing gap: PHP keeps the string key foo first, so bar comes before 1
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-before-after-string-key-first"
                expect(stringKeyFirst().before(1)).toBe("bar");
            },
        );
    });

    describe("after", () => {
        describe("Laravel Tests", () => {
            it("test after returns item after the given item", () => {
                // CollectionTest::testAfterReturnsItemAfterTheGivenItem
                const c = collect({
                    0: 1,
                    1: 2,
                    2: 3,
                    3: 4,
                    4: 2,
                    5: 5,
                    name: "taylor",
                    framework: "laravel",
                });

                expect(c.after(1)).toBe(2);
                expect(c.after(2)).toBe(3);
                expect(c.after(3)).toBe(4);
                expect(c.after(4)).toBe(2);
                expect(c.after(5)).toBe("taylor");
                expect(c.after("taylor")).toBe("laravel");

                expect(
                    c.after((value) => {
                        // @ts-expect-error - operator > on string | number union
                        return value > 2;
                    }),
                ).toBe(4);
                expect(
                    c.after((value) => {
                        return typeof value === "string";
                    }),
                ).toBe("laravel");
            });

            it("test after in strict mode", () => {
                // CollectionTest::testAfterInStrictMode
                const emptyArray: unknown[] = [];
                const c = collect([false, 0, 1, emptyArray, ""]);

                expect(c.after("false", true)).toBeNull();
                expect(c.after("1", true)).toBeNull();
                expect(c.after("", true)).toBeNull();
                expect(c.after(false, true)).toBe(0);
                expect(c.after(1, true)).toBe(emptyArray);
                expect(c.after(emptyArray, true)).toBe("");
            });

            it("test after returns null when item is not found", () => {
                // CollectionTest::testAfterReturnsNullWhenItemIsNotFound
                const c = collect({
                    0: 1,
                    1: 2,
                    2: 3,
                    3: 4,
                    4: 5,
                    foo: "bar",
                });

                expect(c.after(6)).toBeNull();
                expect(c.after("foo")).toBeNull();
                expect(
                    c.after((value) => {
                        // @ts-expect-error - operator < on string | number union
                        return value < 1 && typeof value === "number";
                    }),
                ).toBeNull();
                expect(
                    c.after((value) => {
                        return value === "nope";
                    }),
                ).toBeNull();
            });

            it("test after returns null when item on the last item", () => {
                // CollectionTest::testAfterReturnsNullWhenItemOnTheLastItem
                const c = collect({
                    0: 1,
                    1: 2,
                    2: 3,
                    3: 4,
                    4: 5,
                    foo: "bar",
                });

                expect(c.after("bar")).toBeNull();
                expect(
                    c.after((value) => {
                        // @ts-expect-error - operator > on string | number union
                        return value > 4 && typeof value !== "number";
                    }),
                ).toBeNull();
            });
        });

        it.fails(
            "finds nothing after the last item when a string key leads",
            () => {
                // Ordered-backing gap: PHP keeps the string key foo first, so nothing comes after 5
                // CollectionTest::testAfterReturnsNullWhenItemOnTheLastItem
                expect(stringKeyFirst().after(5)).toBeNull();
            },
        );

        it.fails(
            "finds the first integer key's item after a leading string key's",
            () => {
                // Ordered-backing gap: PHP keeps the string key foo first, so 1 comes after bar
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-before-after-string-key-first"
                expect(stringKeyFirst().after("bar")).toBe(1);
            },
        );
    });

    describe("shift", () => {
        it("takes a fractional count's whole items and every item for NAN, as PHP's loop over range() does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-shift-fractional-and-non-finite-counts"
            const list = collect([1, 2, 3, 4]);

            expect(list.shift(2.5).all()).toEqual([1, 2]);
            expect(list.all()).toEqual([3, 4]);
            expect(list.keys().all()).toEqual([0, 1]);
            expect(list.values().all()).toEqual([3, 4]);

            const keyed = collect({ a: 1, b: 2, c: 3, d: 4 });

            expect(keyed.shift(2.5).all()).toEqual([1, 2]);
            expect(keyed.all()).toEqual({ c: 3, d: 4 });
            expect(keyed.keys().all()).toEqual(["c", "d"]);
            expect(keyed.values().all()).toEqual([3, 4]);

            for (const count of [NaN, Infinity, 1e19]) {
                const everything = collect([1, 2, 3, 4]);

                expect(everything.shift(count).all()).toEqual([1, 2, 3, 4]);
                expect(everything.all()).toEqual([]);
                expect(everything.keys().all()).toEqual([]);
                expect(everything.values().all()).toEqual([]);
            }

            const emptied = collect({ a: 1, b: 2, c: 3, d: 4 });

            expect(emptied.shift(NaN).all()).toEqual([1, 2, 3, 4]);
            // JS-only: an empty keyed result keeps its record, which JSON writes as PHP's []
            expect(emptied.all()).toEqual({});
            expect(emptied.keys().all()).toEqual([]);
            expect(emptied.values().all()).toEqual([]);
        });

        it("throws range()'s ValueError for a fractional count below 2 and shifts nothing, unless fewer items cap it", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-shift-fractional-and-non-finite-counts"
            const failure = new Error(
                "range(): Argument #3 ($step) must be less than the range spanned by argument #1 ($start) and argument #2 ($end)",
            );

            for (const count of [1.5, 0.5]) {
                const list = collect([1, 2, 3, 4]);
                const keyed = collect({ a: 1, b: 2, c: 3, d: 4 });

                expect(() => list.shift(count)).toThrow(failure);
                expect(list.all()).toEqual([1, 2, 3, 4]);
                expect(list.keys().all()).toEqual([0, 1, 2, 3]);
                expect(list.values().all()).toEqual([1, 2, 3, 4]);
                expect(() => keyed.shift(count)).toThrow(failure);
                expect(keyed.all()).toEqual({ a: 1, b: 2, c: 3, d: 4 });
                expect(keyed.keys().all()).toEqual(["a", "b", "c", "d"]);
                expect(keyed.values().all()).toEqual([1, 2, 3, 4]);
            }

            const one = collect([9]);

            expect(one.shift(1.5).all()).toEqual([9]);
            expect(one.all()).toEqual([]);
            expect(collect([]).shift(1.5)).toBeNull();
        });

        it("takes a fractional or NAN count in the order PHP's array holds integer keys out of order", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-shift-and-pop-counts-out-of-order-keys"
            const outOfOrder = () =>
                collect(
                    new Map([
                        [2, "c"],
                        [0, "a"],
                        [1, "b"],
                    ]),
                );
            const partly = outOfOrder();

            expect(partly.shift(2.5).all()).toEqual(["c", "a"]);
            expect(partly.all()).toEqual({ 0: "b" });
            expect(partly.keys().all()).toEqual([0]);
            expect(partly.values().all()).toEqual(["b"]);

            const refused = outOfOrder();

            expect(() => refused.shift(1.5)).toThrow(
                "range(): Argument #3 ($step) must be less than the range spanned by argument #1 ($start) and argument #2 ($end)",
            );
            expect(refused.keys().all()).toEqual([2, 0, 1]);
            expect(refused.values().all()).toEqual(["c", "a", "b"]);

            const everything = outOfOrder();

            expect(everything.shift(NaN).all()).toEqual(["c", "a", "b"]);
            expect(everything.keys().all()).toEqual([]);
            expect(everything.values().all()).toEqual([]);
        });

        it("renumbers a negative integer key on an object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "shift-negative-int-keys"
            const c = collect({ x: "a", "-1": "b", "-2": "c", y: "d" });

            expect(c.shift(2).all()).toEqual(["a", "b"]);
            expect(c.all()).toEqual({ 0: "c", y: "d" });
        });

        describe("Laravel Tests", () => {
            it("test shift returns and removes first item in collection", () => {
                // CollectionTest::testShiftReturnsAndRemovesFirstItemInCollection
                const data = collect(["Taylor", "Otwell"]);

                expect(data.shift()).toBe("Taylor");
                expect(data.first()).toBe("Otwell");
                expect(data.shift()).toBe("Otwell");
                expect(data.first()).toBeNull();
            });

            it("test shift returns and removes first x items in collection", () => {
                // CollectionTest::testShiftReturnsAndRemovesFirstXItemsInCollection
                const data = collect(["foo", "bar", "baz"]);

                expect(data.shift(2).all()).toEqual(["foo", "bar"]);
                expect(data.first()).toBe("baz");

                expect(collect(["foo", "bar", "baz"]).shift(6).all()).toEqual([
                    "foo",
                    "bar",
                    "baz",
                ]);

                const data2 = collect(["foo", "bar", "baz"]);

                expect(data2.shift(0).all()).toEqual([]);
                expect(data2.all()).toEqual(["foo", "bar", "baz"]);

                expect(() => {
                    collect(["foo", "bar", "baz"]).shift(-1);
                }).toThrowError(InvalidArgumentException);

                expect(() => {
                    collect(["foo", "bar", "baz"]).shift(-2);
                }).toThrowError(InvalidArgumentException);
            });

            it("test shift returns null on empty collection", () => {
                // CollectionTest::testShiftReturnsNullOnEmptyCollection
                const items = collect([]);

                expect(items.shift()).toBeNull();

                const itemFoo: Record<string, string> = { text: "f" };
                const itemBar: Record<string, string> = { text: "x" };

                const items2 = collect([itemFoo, itemBar]);

                const foo = items2.shift();
                const bar = items2.shift();

                expect(foo?.["text"]).toBe("f");
                expect(bar?.["text"]).toBe("x");
                expect(items2.shift()).toBeNull();
            });
        });

        it("test shift function comprehensive coverage", () => {
            // Test shift with objects - single item (count = 1)
            const objCollection = collect({ a: 1, b: 2, c: 3 });
            expect(objCollection.shift()).toBe(1);
            expect(objCollection.all()).toEqual({ b: 2, c: 3 });

            // Test shift with objects - multiple items (count > 1)
            const objCollection2 = collect({ x: 10, y: 20, z: 30 });
            const shifted = objCollection2.shift(2);
            expect(shifted.all()).toEqual([10, 20]);
            expect(objCollection2.all()).toEqual({ z: 30 });

            // Test shift with objects - shift more than available
            const objCollection3 = collect({ p: 100, q: 200 });
            const shiftedAll = objCollection3.shift(5);
            expect(shiftedAll.all()).toEqual([100, 200]);
            expect(objCollection3.count()).toBe(0);

            // JS-only: a stored undefined is an item, which shift hands back as it is
            const arrWithUndef = collect([undefined, 1, 2]);
            expect(arrWithUndef.shift()).toBeUndefined();
            expect(arrWithUndef.all()).toEqual([1, 2]);
        });

        it("handles object with keys branch", () => {
            const c = collect({ a: 1, b: 2, c: 3 });
            const shifted = c.shift(2);
            expect(shifted.all()).toEqual([1, 2]);
            expect(c.all()).toEqual({ c: 3 });
        });

        it("handles object shift when count exceeds items (empty keys branch)", () => {
            // This tests the case where keys.length === 0 during the shift loop
            // (when we've shifted all items but still have iterations left)
            const c = collect({ a: 1 });
            // Request 3 items but only 1 exists - will try to shift from empty object
            const shifted = c.shift(3);
            expect(shifted.all()).toEqual([1]); // Only got 1 item
            expect(c.all()).toEqual({}); // Object is now empty
        });

        it("hands back the value itself for a count of 1", () => {
            const collection = collect([1, 2, 3]);
            const returned = collection.shift(1);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-shift-one-on-list-returns-value"
            expect({ returned, all: collection.all() }).toEqual({
                returned: 1,
                all: [2, 3],
            });
        });

        it("throws InvalidArgumentException for a negative count, even on an empty collection", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-shift-negative-on-empty-throws"
            expect(() => collect([]).shift(-1)).toThrow(
                InvalidArgumentException,
            );
            expect(() => collect([]).shift(-1)).toThrow(
                "Number of shifted items may not be less than zero.",
            );
        });

        it("throws from shift on a negative count, either backing", () => {
            expect(() => new Collection([1]).shift(-1)).toThrow(
                "Number of shifted items may not be less than zero.",
            );
            expect(() => new Collection({ a: 1 }).shift(-1)).toThrow(
                "Number of shifted items may not be less than zero.",
            );
        });
    });

    describe("shuffle", () => {
        it("test shuffle", () => {
            // JS-only: CollectionTest has no shuffle test; the draw is random, so only the count and members are pinned
            const data = collect([1, 2, 3, 4, 5, 6]);
            const shuffled = data.shuffle();

            expect(shuffled.count()).toBe(6);
            expect(data.all()).toContain(shuffled.get(0));
            expect(data.all()).toContain(shuffled.get(1));
            expect(data.all()).toContain(shuffled.get(2));
            expect(data.all()).toContain(shuffled.get(3));
            expect(data.all()).toContain(shuffled.get(4));
            expect(data.all()).toContain(shuffled.get(5));
        });

        it("returns integer keys for an object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "shuffle-assoc-keys", "shuffle-assoc-values-sorted"
            const shuffled = collect({ a: 1, b: 2, c: 3, d: 4, e: 5 })
                .shuffle()
                .all();

            expect(Object.values(shuffled).sort()).toEqual([1, 2, 3, 4, 5]);
            expect(Object.keys(shuffled)).toEqual(["0", "1", "2", "3", "4"]);
        });

        it("hands back a list whatever keys the items had, as Arr::shuffle does", () => {
            const pinShuffled = <
                TValue,
                TKey extends PropertyKey,
                TShape extends CollectionShape,
            >(
                collection: Collection<TValue, TKey, TShape>,
                members: TValue[],
            ) => {
                const shuffled = collection.shuffle();

                expect(Array.isArray(shuffled.all())).toBe(true);
                expect(shuffled.count()).toBe(members.length);
                expect(Object.values(shuffled.all()).sort()).toEqual(members);
            };

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-shuffle-list"
            pinShuffled(collect({ a: 1, b: 2, c: 3 }), [1, 2, 3]);
            pinShuffled(outOfOrderKeys(), ["a", "b", "c"]);
            pinShuffled(collect({ x: 1, 5: 2 }), [1, 2]);
        });
    });

    describe("sliding", () => {
        describe("Laravel Tests", () => {
            it("test sliding", () => {
                // CollectionTest::testSliding
                // Default parameters: $size = 2, $step = 1
                expect(Collection.times(0).sliding().toArray()).toEqual([]);
                expect(Collection.times(1).sliding().toArray()).toEqual([]);
                expect(Collection.times(2).sliding().toArray()).toEqual([
                    [1, 2],
                ]);
                expect(
                    Collection.times(3)
                        .sliding()
                        .map((item) => item.values())
                        .toArray(),
                ).toEqual([
                    [1, 2],
                    [2, 3],
                ]);

                // Custom step: $size = 2, $step = 3
                expect(Collection.times(1).sliding(2, 3).toArray()).toEqual([]);
                expect(Collection.times(2).sliding(2, 3).toArray()).toEqual([
                    [1, 2],
                ]);
                expect(Collection.times(3).sliding(2, 3).toArray()).toEqual([
                    [1, 2],
                ]);
                expect(Collection.times(4).sliding(2, 3).toArray()).toEqual([
                    [1, 2],
                ]);
                expect(
                    Collection.times(5)
                        .sliding(2, 3)
                        .map((item) => item.values())
                        .toArray(),
                ).toEqual([
                    [1, 2],
                    [4, 5],
                ]);

                // Custom size: $size = 3, $step = 1
                expect(Collection.times(2).sliding(3).toArray()).toEqual([]);
                expect(Collection.times(3).sliding(3).toArray()).toEqual([
                    [1, 2, 3],
                ]);
                expect(
                    Collection.times(4)
                        .sliding(3)
                        .map((item) => item.values())
                        .toArray(),
                ).toEqual([
                    [1, 2, 3],
                    [2, 3, 4],
                ]);

                // Custom size and custom step: $size = 3, $step = 2
                expect(Collection.times(2).sliding(3, 2).toArray()).toEqual([]);
                expect(Collection.times(3).sliding(3, 2).toArray()).toEqual([
                    [1, 2, 3],
                ]);
                expect(Collection.times(4).sliding(3, 2).toArray()).toEqual([
                    [1, 2, 3],
                ]);
                expect(
                    Collection.times(5)
                        .sliding(3, 2)
                        .map((item) => item.values())
                        .toArray(),
                ).toEqual([
                    [1, 2, 3],
                    [3, 4, 5],
                ]);
                expect(
                    Collection.times(6)
                        .sliding(3, 2)
                        .map((item) => item.values())
                        .toArray(),
                ).toEqual([
                    [1, 2, 3],
                    [3, 4, 5],
                ]);

                // The windows are collections too. JS-only: a list's windows are renumbered from 0, where PHP
                // keeps [[0 => 1, 1 => 2], [1 => 2, 2 => 3]]
                const chunks = Collection.times(3).sliding();

                expect(chunks.toArray()).toEqual([
                    [1, 2],
                    [2, 3],
                ]);

                expect(chunks).toBeInstanceOf(Collection);
                expect(chunks.first()).toBeInstanceOf(Collection);
                expect(chunks.skip(1).first()).toBeInstanceOf(Collection);

                // Test invalid size parameter (size must be at least 1)
                for (const size of [0, -1]) {
                    expect(() =>
                        Collection.times(5).sliding(size, 1).toArray(),
                    ).toThrow(InvalidArgumentException);
                    expect(() =>
                        Collection.times(5).sliding(size, 1).toArray(),
                    ).toThrow("Size value must be at least 1.");
                }

                // Test invalid step parameter (step must be at least 1)
                for (const step of [0, -1]) {
                    expect(() =>
                        Collection.times(5).sliding(2, step).toArray(),
                    ).toThrow(InvalidArgumentException);
                    expect(() =>
                        Collection.times(5).sliding(2, step).toArray(),
                    ).toThrow("Step value must be at least 1.");
                }
            });
        });

        it("keeps a record's keys in each window", () => {
            const windows = collect({ a: 1, b: 2, c: 3 }).sliding();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sliding-assoc"
            expect(windows.map((window) => viewsOf(window)).all()).toEqual([
                { all: { a: 1, b: 2 }, keys: ["a", "b"], values: [1, 2] },
                { all: { b: 2, c: 3 }, keys: ["b", "c"], values: [2, 3] },
            ]);
        });

        it("makes no window for a size over the count", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sliding-size-over-count"
            expect(collect([1, 2, 3]).sliding(5).all()).toEqual([]);
        });

        it("counts the windows with a fractional size or step, and slices each as slice() does", () => {
            const numbers = collect([1, 2, 3, 4, 5]);
            const windows = (size: number, step?: number) =>
                numbers
                    .sliding(size, step)
                    .map((window) => window.values().all())
                    .all();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sliding-counts"
            expect(windows(1.5)).toEqual([[1], [2], [3], [4]]);
            expect(windows(2.5)).toEqual([
                [1, 2],
                [2, 3],
                [3, 4],
            ]);
            expect(windows(2, 1.5)).toEqual([
                [1, 2],
                [2, 3],
                [4, 5],
            ]);
            expect(windows(Infinity)).toEqual([]);
            expect(windows(1e19)).toEqual([]);
            expect(windows(2, 1e19)).toEqual([[1, 2]]);
        });

        it("slices its windows from an offset array_slice refuses when the step is infinite", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sliding-counts"
            for (const collection of [collect([1, 2, 3, 4, 5]), collect([])]) {
                expect(() => collection.sliding(2, Infinity)).toThrowError(
                    "array_slice(): Argument #2 ($offset) must be of type int, float given",
                );
            }
        });

        it("keeps a subclass, outside and in each window, as static::times does", () => {
            class Sub extends Collection<number, number> {}

            const windows = new Sub([1, 2, 3]).sliding();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sliding-subclass"
            expect([
                windows instanceof Sub,
                windows.first() instanceof Sub,
            ]).toEqual([true, true]);
        });

        it("throws range()'s error for a NAN size or step, as static::times hands the count to range()", () => {
            const numbers = collect([1, 2, 3, 4, 5]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sliding-counts"
            expect(() => numbers.sliding(NaN)).toThrowError(
                "range(): Argument #2 ($end) must be a finite number, NAN provided",
            );
            expect(() => numbers.sliding(2, NaN)).toThrowError(
                "range(): Argument #2 ($end) must be a finite number, NAN provided",
            );
        });
    });

    describe("skip", () => {
        describe("Laravel Tests", () => {
            it("test skip method", () => {
                // CollectionTest::testSkipMethod
                const data = collect([1, 2, 3, 4, 5, 6]);

                // Total items to skip is smaller than collection length
                expect(data.skip(4).values().all()).toEqual([5, 6]);

                // Total items to skip is more than collection length
                expect(data.skip(10).values().all()).toEqual([]);
            });
        });

        it("skips from the end for a negative count, as slice() does", () => {
            const skipped = collect([1, 2, 3]).skip(-1);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-skip-negative"
            expect(skipped.values().all()).toEqual([3]);
            // JS-only: a list is renumbered from 0, where PHP keeps the item's key 2
            expect(skipped.keys().all()).toEqual([0]);
        });
    });

    describe("skipUntil", () => {
        describe("Laravel Tests", () => {
            it("test skip until", () => {
                // CollectionTest::testSkipUntil
                let data = collect([1, 1, 2, 2, 3, 3, 4, 4]);

                expect(data.skipUntil(1).values().all()).toEqual([
                    1, 1, 2, 2, 3, 3, 4, 4,
                ]);
                expect(data.skipUntil(3).values().all()).toEqual([3, 3, 4, 4]);
                expect(data.skipUntil(5).values().all()).toEqual([]);

                data = data.skipUntil((value) => value <= 1).values();
                expect(data.all()).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);

                data = data.skipUntil((value) => value >= 3).values();
                expect(data.all()).toEqual([3, 3, 4, 4]);

                data = data.skipUntil((value) => value >= 5).values();
                expect(data.all()).toEqual([]);
            });
        });

        it("keeps a keyed collection's keys", () => {
            const skipped = collect({ a: 1, b: 2, c: 3 }).skipUntil(2);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-skipUntil-keyed"
            expect(skipped.all()).toEqual({ b: 2, c: 3 });
            expect(skipped.keys().all()).toEqual(["b", "c"]);
            expect(skipped.values().all()).toEqual([2, 3]);
        });

        it("renumbers a list's keys, as every removal from a list does", () => {
            const skipped = collect([1, 2, 3, 4]).skipUntil(3);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-skipUntil-list-keys", whose keys 2
            // and 3 name these items
            expect(skipped.all()).toEqual([3, 4]);
            expect(skipped.keys().all()).toEqual([0, 1]);
            expect(skipped.values().all()).toEqual([3, 4]);
        });

        it("compares the value with PHP's ===", () => {
            const items: (number | string)[] = [1, 2, 3, 4];

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-skipUntil-strict-value"
            expect(collect(items).skipUntil("3").all()).toEqual([]);
        });

        it("hands a callback each value and key", () => {
            const keyed = collect({ a: 1, b: 2, c: 3 }).skipUntil(
                (_value, key) => key === "b",
            );
            const list = collect(["x", "y", "z"]).skipUntil(
                (_value, key) => key === 1,
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-skipUntil-callback-key"
            expect(keyed.all()).toEqual({ b: 2, c: 3 });
            expect([keyed.keys().all(), keyed.values().all()]).toEqual([
                ["b", "c"],
                [2, 3],
            ]);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-skip-take-callback-index", whose keys
            // 1 and 2 name these items; a list renumbers them, as every removal from a list does
            expect(list.all()).toEqual(["y", "z"]);
            expect([list.keys().all(), list.values().all()]).toEqual([
                [0, 1],
                ["y", "z"],
            ]);
        });

        it.fails("walks a Map-built collection in its insertion order", () => {
            const skipped = outOfOrderKeys().skipUntil("a");

            // Ordered-backing gap: PHP walks key 2 first, so skipping until a keeps a and b under keys 0 and 1
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-skipUntil-out-of-order-keys"
            expect([skipped.keys().all(), skipped.values().all()]).toEqual([
                [0, 1],
                ["a", "b"],
            ]);
        });
    });

    describe("skipWhile", () => {
        describe("Laravel Tests", () => {
            it("test skip while", () => {
                // CollectionTest::testSkipWhile
                let data = collect([1, 1, 2, 2, 3, 3, 4, 4]);

                expect(data.skipWhile(1).values().all()).toEqual([
                    2, 2, 3, 3, 4, 4,
                ]);
                expect(data.skipWhile(5).values().all()).toEqual([
                    1, 1, 2, 2, 3, 3, 4, 4,
                ]);
                expect(data.skipWhile(2).values().all()).toEqual([
                    1, 1, 2, 2, 3, 3, 4, 4,
                ]);

                data = data.skipWhile((value) => value >= 5).values();
                expect(data.all()).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);

                data = data.skipWhile((value) => value >= 2).values();
                expect(data.all()).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);

                data = data.skipWhile((value) => value < 3).values();
                expect(data.all()).toEqual([3, 3, 4, 4]);
            });
        });

        it("keeps a keyed collection's keys", () => {
            const skipped = collect({ a: 1, b: 2, c: 1 }).skipWhile(1);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-skipWhile-keyed"
            expect(skipped.all()).toEqual({ b: 2, c: 1 });
            expect(skipped.keys().all()).toEqual(["b", "c"]);
            expect(skipped.values().all()).toEqual([2, 1]);
        });

        it("renumbers a list's keys, as every removal from a list does", () => {
            const skipped = collect([1, 1, 2, 1]).skipWhile(1);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-skipWhile-list-keys", whose keys 2
            // and 3 name these items
            expect(skipped.all()).toEqual([2, 1]);
            expect(skipped.keys().all()).toEqual([0, 1]);
            expect(skipped.values().all()).toEqual([2, 1]);
        });

        it("compares the value with PHP's ===", () => {
            const items: (number | string)[] = [1, 1, 2];

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-skipWhile-strict-value"
            expect(collect(items).skipWhile("1").all()).toEqual([1, 1, 2]);
        });

        it("hands a callback each value and key", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-skipWhile-callback-key", whose keys
            // 1 and 2 name these items; a list renumbers them, as every removal from a list does
            expect(
                collect(["x", "y", "z"])
                    .skipWhile((_value, key) => key < 1)
                    .all(),
            ).toEqual(["y", "z"]);
        });

        it.fails("walks a Map-built collection in its insertion order", () => {
            const skipped = outOfOrderKeys().skipWhile("c");

            // Ordered-backing gap: PHP walks key 2 first, so skipping while c keeps a and b under keys 0 and 1
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-skip-take-out-of-order-keys"
            expect([skipped.keys().all(), skipped.values().all()]).toEqual([
                [0, 1],
                ["a", "b"],
            ]);
        });
    });

    describe("slice", () => {
        describe("Laravel Tests", () => {
            it("test slice offset", () => {
                // CollectionTest::testSliceOffset
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8]);
                expect(data.slice(3).values().all()).toEqual([4, 5, 6, 7, 8]);
            });

            it("test slice negative offset", () => {
                // CollectionTest::testSliceNegativeOffset
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8]);
                expect(data.slice(-3).values().all()).toEqual([6, 7, 8]);
            });

            it("test slice offset and length", () => {
                // CollectionTest::testSliceOffsetAndLength
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8]);
                expect(data.slice(3, 3).values().all()).toEqual([4, 5, 6]);
            });

            it("test slice offset and negative length", () => {
                // CollectionTest::testSliceOffsetAndNegativeLength
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8]);
                expect(data.slice(3, -1).values().all()).toEqual([4, 5, 6, 7]);
            });

            it("test slice negative offset and length", () => {
                // CollectionTest::testSliceNegativeOffsetAndLength
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8]);
                expect(data.slice(-5, 3).values().all()).toEqual([4, 5, 6]);
            });

            it("test slice negative offset and negative length", () => {
                // CollectionTest::testSliceNegativeOffsetAndNegativeLength
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8]);
                expect(data.slice(-6, -2).values().all()).toEqual([3, 4, 5, 6]);
            });
        });

        // A negative offset combined with a length beyond the remaining tail used to
        // return an empty result instead of the last N items — PHP-verified
        // (docs/php-parity/task-04-shared.json, "slice(-2,5) preserve_keys").
        it("slices from the end for a negative offset with a length — both shapes agree", () => {
            const arr = collect([1, 2, 3, 4, 5, 6, 7, 8]);
            expect(arr.slice(-2, 5).all()).toEqual([7, 8]);

            const obj = collect({
                a: 1,
                b: 2,
                c: 3,
                d: 4,
                e: 5,
                f: 6,
                g: 7,
                h: 8,
            });
            expect(obj.slice(-2, 5).all()).toEqual({ g: 7, h: 8 });
        });

        // Both backings share the byte-identical over-negative-length defect, so without
        // this pin they'd still "agree" while both diverging from PHP.
        // PHP-verified in docs/php-parity/task-12-regression-pins.json.
        it("agrees across backings on an over-negative slice length", () => {
            expect(new Collection([1, 2, 3]).slice(0, -5).all()).toEqual([]);
            expect(
                new Collection({ a: 1, b: 2, c: 3 }).slice(0, -5).all(),
            ).toEqual({});
        });

        it("drops a fraction from an offset or a length, as array_slice's int parameters do", () => {
            const numbers = collect([1, 2, 3, 4, 5]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-slice-counts"
            expect(numbers.slice(1.5).values().all()).toEqual([2, 3, 4, 5]);
            expect(numbers.slice(-1.5).values().all()).toEqual([5]);
            expect(numbers.slice(0, 1.5).values().all()).toEqual([1]);
        });

        it("throws array_slice's TypeError for an offset or a length that is NAN, infinite or beyond PHP's int range", () => {
            const numbers = collect([1, 2, 3, 4, 5]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-slice-counts"
            for (const count of [NaN, Infinity, 1e19]) {
                expect(() => numbers.slice(count)).toThrowError(TypeError);
                expect(() => numbers.slice(count)).toThrowError(
                    "array_slice(): Argument #2 ($offset) must be of type int, float given",
                );
                expect(() => numbers.slice(0, count)).toThrowError(TypeError);
                expect(() => numbers.slice(0, count)).toThrowError(
                    "array_slice(): Argument #3 ($length) must be of type ?int, float given",
                );
            }
        });
    });

    describe("split", () => {
        it("throws PHP's Modulo by zero for a number of groups the int cast wraps to 0", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-nth-and-split-by-a-count-cast-to-0"
            expect(() => collect([1, 2, 3]).split(2 ** 64)).toThrow(
                new Error("Modulo by zero"),
            );
        });

        describe("Laravel Tests", () => {
            it("test split collection with a divisible count", () => {
                // CollectionTest::testSplitCollectionWithADivisibleCount
                const data = collect(["a", "b", "c", "d"]);
                const split = data.split(2);

                expect(split.get(0)!.all()).toEqual(["a", "b"]);
                expect(split.get(1)!.all()).toEqual(["c", "d"]);
                expect(split).toBeInstanceOf(Collection);

                expect(
                    data
                        .split(2)
                        .map((chunk) => chunk.values().toArray())
                        .toArray(),
                ).toEqual([
                    ["a", "b"],
                    ["c", "d"],
                ]);

                const data2 = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
                const split2 = data2.split(2);

                expect(split2.get(0)!.all()).toEqual([1, 2, 3, 4, 5]);
                expect(split2.get(1)!.all()).toEqual([6, 7, 8, 9, 10]);

                expect(
                    data2
                        .split(2)
                        .map((chunk) => chunk.values().toArray())
                        .toArray(),
                ).toEqual([
                    [1, 2, 3, 4, 5],
                    [6, 7, 8, 9, 10],
                ]);
            });

            it("test split collection with an undivisable count", () => {
                // CollectionTest::testSplitCollectionWithAnUndivisableCount
                const data = collect(["a", "b", "c"]);
                const split = data.split(2);

                expect(split.get(0)!.all()).toEqual(["a", "b"]);
                expect(split.get(1)!.all()).toEqual(["c"]);

                expect(
                    data
                        .split(2)
                        .map((chunk) => chunk.values().toArray())
                        .toArray(),
                ).toEqual([["a", "b"], ["c"]]);
            });

            it("test split collection with countless then divisor", () => {
                // CollectionTest::testSplitCollectionWithCountLessThenDivisor
                const data = collect(["a"]);
                const split = data.split(2);

                expect(split.get(0)!.all()).toEqual(["a"]);
                expect(split.get(1)).toBeNull();

                expect(
                    data
                        .split(2)
                        .map((chunk) => chunk.values().toArray())
                        .toArray(),
                ).toEqual([["a"]]);
            });

            it("test split collection into three with count of four", () => {
                // CollectionTest::testSplitCollectionIntoThreeWithCountOfFour
                const data = collect(["a", "b", "c", "d"]);
                const split = data.split(3);

                expect(split.get(0)!.all()).toEqual(["a", "b"]);
                expect(split.get(1)!.all()).toEqual(["c"]);
                expect(split.get(2)!.all()).toEqual(["d"]);

                expect(
                    data
                        .split(3)
                        .map((chunk) => chunk.values().toArray())
                        .toArray(),
                ).toEqual([["a", "b"], ["c"], ["d"]]);
            });

            it("test split collection into threee with count of five", () => {
                // CollectionTest::testSplitCollectionIntoThreeWithCountOfFive
                const data = collect(["a", "b", "c", "d", "e"]);
                const split = data.split(3);

                expect(split.get(0)!.all()).toEqual(["a", "b"]);
                expect(split.get(1)!.all()).toEqual(["c", "d"]);
                expect(split.get(2)!.all()).toEqual(["e"]);

                expect(
                    data
                        .split(3)
                        .map((chunk) => chunk.values().toArray())
                        .toArray(),
                ).toEqual([["a", "b"], ["c", "d"], ["e"]]);
            });

            it("test split collection into six with count of ten", () => {
                // CollectionTest::testSplitCollectionIntoSixWithCountOfTen
                const data = collect([
                    "a",
                    "b",
                    "c",
                    "d",
                    "e",
                    "f",
                    "g",
                    "h",
                    "i",
                    "j",
                ]);
                const split = data.split(6);

                expect(split.get(0)!.all()).toEqual(["a", "b"]);
                expect(split.get(1)!.all()).toEqual(["c", "d"]);
                expect(split.get(2)!.all()).toEqual(["e", "f"]);
                expect(split.get(3)!.all()).toEqual(["g", "h"]);
                expect(split.get(4)!.all()).toEqual(["i"]);
                expect(split.get(5)!.all()).toEqual(["j"]);

                expect(
                    data
                        .split(6)
                        .map((chunk) => chunk.values().toArray())
                        .toArray(),
                ).toEqual([
                    ["a", "b"],
                    ["c", "d"],
                    ["e", "f"],
                    ["g", "h"],
                    ["i"],
                    ["j"],
                ]);
            });

            it("test split empty collection", () => {
                // CollectionTest::testSplitEmptyCollection
                const data = collect([]);
                const split = data.split(2);

                expect(split.get(0)).toBeNull();
                expect(split.get(1)).toBeNull();

                expect(
                    data
                        .split(2)
                        .map((chunk) => chunk.values().toArray())
                        .toArray(),
                ).toEqual([]);
            });

            it("throws exception for invalid number of groups", () => {
                // CollectionTest::testSplitThrowsExceptionForInvalidNumberOfGroups
                expect(() => {
                    collect([1, 2, 3]).split(0);
                }).toThrowError(InvalidArgumentException);
                expect(() => {
                    collect([1, 2, 3]).split(0);
                }).toThrowError("Number of groups must be at least 1.");
            });

            it("throws exception for negative number of groups", () => {
                // CollectionTest::testSplitThrowsExceptionForNegativeNumberOfGroups
                expect(() => {
                    collect([1, 2, 3]).split(-1);
                }).toThrowError(InvalidArgumentException);
                expect(() => {
                    collect([1, 2, 3]).split(-1);
                }).toThrowError("Number of groups must be at least 1.");
            });
        });

        it("splits as PHP does for a fractional number of groups, whose % drops the fraction", () => {
            const numbers = collect([1, 2, 3, 4, 5]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-split-counts"
            expect(
                numbers
                    .split(1.5)
                    .map((group) => group.all())
                    .all(),
            ).toEqual([
                [1, 2, 3],
                [4, 5],
            ]);
            expect(
                numbers
                    .split(2.5)
                    .map((group) => group.all())
                    .all(),
            ).toEqual([[1, 2, 3], [4, 5], []]);
            expect(numbers.split(5.5).all()).toEqual([]);
        });

        it("divides by zero for a NAN or infinite number of groups, unless the collection is empty", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-split-counts"
            expect(() => collect([1, 2, 3, 4, 5]).split(NaN)).toThrowError(
                "Modulo by zero",
            );
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-split-infinite-groups"
            expect(() => collect([1, 2, 3]).split(Infinity)).toThrowError(
                "Modulo by zero",
            );
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-split-counts"
            expect(collect([]).split(NaN).all()).toEqual([]);
            expect(collect([]).split(Infinity).all()).toEqual([]);
        });

        it("stops once every group left would be empty, however many groups it is asked for", () => {
            // JS-only: PHP's loop counts up to the number of groups, so split(1e19) never returns
            expect(
                collect([1, 2, 3])
                    .split(1e19)
                    .map((group) => group.all())
                    .all(),
            ).toEqual([[1], [2], [3]]);
        });

        it("renumbers the integer keys in each group, as array_slice does without preserve_keys", () => {
            const groups = collect({ 5: "a", 6: "b", 7: "c" }).split(2);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-split-int-keys-renumber"
            expect(groups.map((group) => viewsOf(group)).all()).toEqual([
                { all: ["a", "b"], keys: [0, 1], values: ["a", "b"] },
                { all: ["c"], keys: [0], values: ["c"] },
            ]);
        });

        it("keeps the string keys in each group", () => {
            const groups = collect({ a: 1, b: 2, c: 3 }).split(2);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-split-assoc-keys"
            expect(groups.map((group) => viewsOf(group)).all()).toEqual([
                { all: { a: 1, b: 2 }, keys: ["a", "b"], values: [1, 2] },
                { all: { c: 3 }, keys: ["c"], values: [3] },
            ]);
        });

        it("puts one item in each group when there are more groups than items", () => {
            const groups = collect([1, 2, 3]).split(5);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-split-more-groups-than-items"
            expect(groups.map((group) => viewsOf(group)).all()).toEqual([
                { all: [1], keys: [0], values: [1] },
                { all: [2], keys: [0], values: [2] },
                { all: [3], keys: [0], values: [3] },
            ]);
        });

        it("splits a Map-built collection in the order it holds its items", () => {
            const mixed = collect(
                new Map<number | string, string>([
                    [2, "c"],
                    ["x", "a"],
                    [1, "b"],
                ]),
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-split-out-of-order"
            expect(
                outOfOrderKeys()
                    .split(2)
                    .map((group) => viewsOf(group))
                    .all(),
            ).toEqual([
                { all: ["c", "a"], keys: [0, 1], values: ["c", "a"] },
                { all: ["b"], keys: [0], values: ["b"] },
            ]);
            expect(
                mixed
                    .split(2)
                    .map((group) => viewsOf(group))
                    .all(),
            ).toEqual([
                { all: { 0: "c", x: "a" }, keys: [0, "x"], values: ["c", "a"] },
                { all: ["b"], keys: [0], values: ["b"] },
            ]);
        });
    });

    describe("splitIn", () => {
        describe("Laravel Tests", () => {
            it("test split in", () => {
                // CollectionTest::testSplitIn
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
                const split = data.splitIn(3);

                expect(split).toBeInstanceOf(Collection);
                expect(split.first()).toBeInstanceOf(Collection);
                expect(split.count()).toBe(3);
                expect(split.get(0)!.values().toArray()).toEqual([1, 2, 3, 4]);
                expect(split.get(1)!.values().toArray()).toEqual([5, 6, 7, 8]);
                expect(split.get(2)!.values().toArray()).toEqual([9, 10]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-splitIn-keeps-keys"
                expect(split.map((chunk) => chunk.keys().all()).all()).toEqual([
                    [0, 1, 2, 3],
                    [4, 5, 6, 7],
                    [8, 9],
                ]);
                expect(split.get(1)?.all()).toEqual({ 4: 5, 5: 6, 6: 7, 7: 8 });
            });

            it("throws exception for invalid number of groups", () => {
                // CollectionTest::testSplitInThrowsExceptionForInvalidNumberOfGroups
                expect(() => {
                    collect([1, 2, 3]).splitIn(0);
                }).toThrowError(InvalidArgumentException);
                expect(() => {
                    collect([1, 2, 3]).splitIn(0);
                }).toThrowError("Number of groups must be at least 1.");
            });

            it("throws exception for negative number of groups", () => {
                // CollectionTest::testSplitInThrowsExceptionForNegativeNumberOfGroups
                expect(() => {
                    collect([1, 2, 3]).splitIn(-1);
                }).toThrowError(InvalidArgumentException);
                expect(() => {
                    collect([1, 2, 3]).splitIn(-1);
                }).toThrowError("Number of groups must be at least 1.");
            });
        });

        it("puts one item in each chunk when there are more groups than items, keeping their keys", () => {
            const chunks = collect([1, 2, 3]).splitIn(5);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-splitIn-more-groups-than-items"
            expect(
                chunks
                    .map((chunk) => [chunk.keys().all(), chunk.values().all()])
                    .all(),
            ).toEqual([
                [[0], [1]],
                [[1], [2]],
                [[2], [3]],
            ]);
        });

        it("splits an empty collection into no chunks", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-splitIn-empty"
            expect(collect([]).splitIn(2).all()).toEqual([]);
        });

        it("reads its chunk size through PHP's int cast, which makes NAN 0", () => {
            const numbers = collect([1, 2, 3, 4, 5]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-splitIn-counts"
            expect(numbers.splitIn(NaN).all()).toEqual([]);
            expect(numbers.splitIn(Infinity).all()).toEqual([]);
            expect(
                numbers
                    .splitIn(1.5)
                    .map((chunk) => chunk.values().all())
                    .all(),
            ).toEqual([[1, 2, 3, 4], [5]]);
            expect(
                numbers
                    .splitIn(1e19)
                    .map((chunk) => chunk.values().all())
                    .all(),
            ).toEqual([[1], [2], [3], [4], [5]]);
        });

        it.fails(
            "splits a Map-built collection in the order it holds its items",
            () => {
                const chunks = outOfOrderKeys().splitIn(2);

                // Ordered-backing gap: PHP's first chunk holds 2 => c then 0 => a, and its second 1 => b
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-splitIn-out-of-order"
                expect(
                    chunks
                        .map((chunk) => [
                            chunk.keys().all(),
                            chunk.values().all(),
                        ])
                        .all(),
                ).toEqual([
                    [
                        [2, 0],
                        ["c", "a"],
                    ],
                    [[1], ["b"]],
                ]);
            },
        );
    });

    describe("sole", () => {
        describe("Laravel Tests", () => {
            // CollectionTest::testSoleReturnsFirstItemInCollectionIfOnlyOneExists
            it("test sole returns first item in collection if only one exists", () => {
                const c = collect([{ name: "foo" }, { name: "bar" }]);

                expect(c.where("name", "foo").sole()).toEqual({ name: "foo" });
                expect(c.sole("name", "=", "foo")).toEqual({ name: "foo" });
                expect(c.sole("name", "foo")).toEqual({ name: "foo" });
            });

            // CollectionTest::testSoleThrowsExceptionIfNoItemsExist
            it("test sole throws exception if no items exist", () => {
                const c = collect([{ name: "foo" }, { name: "bar" }]);

                expect(() => {
                    c.where("name", "INVALID").sole();
                }).toThrowError(ItemNotFoundException);
            });

            // CollectionTest::testSoleThrowsExceptionIfMoreThanOneItemExists,
            // whose expectExceptionObject pins the count in the message too
            it("test sole throws exception if more than one item exists", () => {
                const c = collect([
                    { name: "foo" },
                    { name: "foo" },
                    { name: "bar" },
                ]);

                expect(() => {
                    c.where("name", "foo").sole();
                }).toThrowError(MultipleItemsFoundException);
                expect(() => {
                    c.where("name", "foo").sole();
                }).toThrowError("2 items were found.");

                let found: MultipleItemsFoundException | null = null;
                try {
                    c.where("name", "foo").sole();
                } catch (error) {
                    if (error instanceof MultipleItemsFoundException) {
                        found = error;
                    }
                }
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-multiple-items-found-count"
                expect([found?.count, found?.getCount()]).toEqual([2, 2]);
            });

            // CollectionTest::testSoleReturnsFirstItemInCollectionIfOnlyOneExistsWithCallback
            it("test sole returns first item in collection if only one exists with callback", () => {
                const data = collect(["foo", "bar", "baz"]);

                const result = data.sole((value) => {
                    return value === "bar";
                });

                expect(result).toBe("bar");
            });

            // CollectionTest::testSoleThrowsExceptionIfNoItemsExistWithCallback
            it("test sole throws exception if no items exist with callback", () => {
                const data = collect(["foo", "bar", "baz"]);
                const sole = () =>
                    data.sole((value) => {
                        return value === "invalid";
                    });

                expect(sole).toThrowError(ItemNotFoundException);
                // docs/php-parity/task-23-obj-release-readiness.json, "sole-none"
                expect(sole).toThrowError(
                    expect.objectContaining({
                        name: "ItemNotFoundException",
                        message: "",
                    }),
                );
            });

            // CollectionTest::testSoleThrowsExceptionIfMoreThanOneItemExistsWithCallback
            it("test sole throws exception if more than one item exists with callback", () => {
                const data = collect(["foo", "bar", "bar"]);
                const sole = () =>
                    data.sole((value) => {
                        return value === "bar";
                    });

                expect(sole).toThrowError(MultipleItemsFoundException);
                expect(sole).toThrowError(
                    expect.objectContaining({
                        name: "MultipleItemsFoundException",
                        message: "2 items were found.",
                    }),
                );

                let found: MultipleItemsFoundException | null = null;
                try {
                    sole();
                } catch (error) {
                    if (error instanceof MultipleItemsFoundException) {
                        found = error;
                    }
                }
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-multiple-items-found-count"
                expect([found?.count, found?.getCount()]).toEqual([2, 2]);
            });
        });

        // docs/php-parity/task-24-data-release-readiness.json,
        // "r2-sole-no-filter-keeps-a-falsy-item": PHP's unless() proxy skips the
        // forwarded filter, so the no-filter form never drops a falsy sole item.
        it("keeps a falsy sole item when no filter is given", () => {
            expect(collect([null]).sole()).toBeNull();
            expect(collect([0]).sole()).toBe(0);
            expect(collect([""]).sole()).toBe("");
            expect(collect([false]).sole()).toBe(false);
        });

        it("still counts every item when no filter is given", () => {
            // Same row: three items stay three, so the count check is not filtered either.
            expect(() => collect([1, 2, 3]).sole()).toThrowError(
                expect.objectContaining({
                    name: "MultipleItemsFoundException",
                    message: "3 items were found.",
                }),
            );
        });

        it("reads a null second argument as the value the key must equal", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-two-args-null-value"
            expect(collect([{ a: null }, { a: 1 }]).sole("a", null)).toEqual({
                a: null,
            });
        });

        it("reads an explicit undefined second argument as PHP's null", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-two-args-null-value":
            // PHP's answer for a null second argument. JS-only: an explicit undefined stands for that null
            expect(
                collect([{ a: null }, { a: 1 }]).sole("a", undefined),
            ).toEqual({ a: null });
        });

        it("throws TypeError for a lone key it cannot call, as PHP's filter() does", () => {
            const collection = collect([{ name: "foo" }]);
            const sole = (key: unknown) => () =>
                Reflect.apply(collection.sole, collection, [key]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-string-key-one-arg-forms-throw" and
            // "C32-C-lone-key-type-error-message", whose class the port names without PHP's namespace
            expect(sole("name")).toThrowError(
                expect.objectContaining({
                    name: "TypeError",
                    message:
                        "Collection::filter(): Argument #1 ($callback) must be of type ?callable, string given",
                }),
            );
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-lone-key-forms-by-key-class"
            expect(sole("0")).toThrowError(TypeError);
            expect(sole(1)).toThrowError(TypeError);
        });

        it("answers the sole item for a lone key PHP compares equal to null", () => {
            const collection = collect([{ name: "foo" }]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-lone-key-forms-by-key-class"
            expect([
                Reflect.apply(collection.sole, collection, [0]),
                Reflect.apply(collection.sole, collection, [""]),
            ]).toEqual([{ name: "foo" }, { name: "foo" }]);
        });

        it.fails(
            "filters a Map-built collection in its insertion order",
            () => {
                const seen: number[] = [];
                expect(() =>
                    outOfOrderKeys().sole((_value, key) => {
                        seen.push(key);

                        return false;
                    }),
                ).toThrowError(ItemNotFoundException);
                let calls = 0;

                // Ordered-backing gap: PHP filters in insertion order, so its first call sees c, under key 2
                // docs/php-parity/task-32-collection-release-readiness.json,
                // "C32-C-filtered-predicates-out-of-order-visits"
                expect([
                    seen,
                    outOfOrderKeys().sole(() => ++calls === 1),
                ]).toEqual([[2, 0, 1], "c"]);
            },
        );
    });

    describe("firstOrFail", () => {
        describe("Laravel Tests", () => {
            // CollectionTest::testFirstOrFailReturnsFirstItemInCollection
            it("test first or fail returns first item in collection", () => {
                const c = collect([{ name: "foo" }, { name: "bar" }]);

                expect(c.where("name", "foo").firstOrFail()).toEqual({
                    name: "foo",
                });
                expect(c.firstOrFail("name", "=", "foo")).toEqual({
                    name: "foo",
                });
                expect(c.firstOrFail("name", "foo")).toEqual({ name: "foo" });
            });

            // CollectionTest::testFirstOrFailThrowsExceptionIfNoItemsExist
            it("test first or fail throws exception if no items exist", () => {
                const c = collect([{ name: "foo" }, { name: "bar" }]);

                expect(() => {
                    c.where("name", "INVALID").firstOrFail();
                }).toThrowError(ItemNotFoundException);
            });

            // CollectionTest::testFirstOrFailDoesntThrowExceptionIfMoreThanOneItemExists
            it("test first or fail doesnt throw exception if more than one item exists", () => {
                const c = collect([
                    { name: "foo" },
                    { name: "foo" },
                    { name: "bar" },
                ]);

                expect(c.where("name", "foo").firstOrFail()).toEqual({
                    name: "foo",
                });
            });

            // CollectionTest::testFirstOrFailReturnsFirstItemInCollectionIfOnlyOneExistsWithCallback
            it("test first or fail returns first item in collection if only one exists with callback", () => {
                const data = collect(["foo", "bar", "baz"]);
                const result = data.firstOrFail((value) => {
                    return value === "bar";
                });
                expect(result).toBe("bar");
            });

            // CollectionTest::testFirstOrFailThrowsExceptionIfNoItemsExistWithCallback
            it("test first or fail throws exception if no items exist with callback", () => {
                const data = collect(["foo", "bar", "baz"]);

                expect(() => {
                    data.firstOrFail((value) => {
                        return value === "invalid";
                    });
                }).toThrowError(ItemNotFoundException);
            });

            // ItemNotFoundException carries no message, as Laravel's does not:
            // it extends RuntimeException without a constructor.
            it("test first or fail throws an exception carrying no message", () => {
                const data = collect(["foo"]);

                expect(() => {
                    data.firstOrFail((value) => value === "invalid");
                }).toThrowError(
                    expect.objectContaining({
                        name: "ItemNotFoundException",
                        message: "",
                    }),
                );
            });

            // CollectionTest::testFirstOrFailDoesntThrowExceptionIfMoreThanOneItemExistsWithCallback
            it("test first or fail doesn't throw exception if more than one item exists with callback", () => {
                const data = collect(["foo", "bar", "bar"]);

                expect(
                    data.firstOrFail((value) => {
                        return value === "bar";
                    }),
                ).toBe("bar");
            });

            // CollectionTest::testFirstOrFailStopsIteratingAtFirstMatch
            it("test first or fail stops iterating at first match", () => {
                const data = collect([
                    () => {
                        return false;
                    },
                    () => {
                        return true;
                    },
                    () => {
                        throw new Error();
                    },
                ]);

                expect(
                    data.firstOrFail((callback) => {
                        return callback();
                    }),
                ).not.toBeNull();
            });
        });

        describe("a stored null is a found item", () => {
            it("returns a stored null instead of throwing", () => {
                // docs/php-parity/task-24-data-release-readiness.json,
                // "firstOrFail-stored-null-list" / "firstOrFail-stored-null-assoc"
                expect(collect([null]).firstOrFail()).toBeNull();
                expect(collect({ a: null }).firstOrFail()).toBeNull();
            });

            it("returns a stored null a callback selected", () => {
                // docs/php-parity/task-24-data-release-readiness.json,
                // "firstOrFail-stored-null-with-callback"
                expect(
                    collect([1, null]).firstOrFail((value) => value === null),
                ).toBeNull();
                // docs/php-parity/task-24-data-release-readiness.json,
                // "firstOrFail-stored-null-assoc-with-callback"
                expect(
                    collect({ a: 1, b: null }).firstOrFail(
                        (value) => value === null,
                    ),
                ).toBeNull();
            });
        });

        it("throws TypeError for a lone key it cannot call, as PHP's first() does", () => {
            const collection = collect([{ name: "foo" }]);
            const firstOrFail = (key: unknown) => () =>
                Reflect.apply(collection.firstOrFail, collection, [key]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-string-key-one-arg-forms-throw" and
            // "C32-C-lone-key-type-error-message", whose class the port names without PHP's namespace
            expect(firstOrFail("name")).toThrowError(
                expect.objectContaining({
                    name: "TypeError",
                    message:
                        "Collection::first(): Argument #1 ($callback) must be of type ?callable, string given",
                }),
            );
            expect(firstOrFail(1)).toThrowError(
                expect.objectContaining({
                    name: "TypeError",
                    message:
                        "Collection::first(): Argument #1 ($callback) must be of type ?callable, int given",
                }),
            );
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-lone-key-forms-by-key-class":
            // first() takes a null callback only, so even the keys PHP compares equal to null throw
            expect(firstOrFail(0)).toThrowError(TypeError);
            expect(firstOrFail("")).toThrowError(TypeError);
            expect(firstOrFail("0")).toThrowError(TypeError);
        });

        it("reads an explicit undefined second argument as PHP's null", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-two-args-null-value-others":
            // PHP's answer for a null second argument. JS-only: an explicit undefined stands for that null
            expect(
                collect([{ a: 1 }, { a: null }]).firstOrFail("a", undefined),
            ).toEqual({ a: null });
            expect(() =>
                collect([{ a: 1 }]).firstOrFail("a", undefined),
            ).toThrowError(ItemNotFoundException);
        });
    });

    describe("chunk", () => {
        describe("Laravel Tests", () => {
            it("test chunk", () => {
                // CollectionTest::testChunk
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
                const chunked = data.chunk(3);

                expect(chunked).toBeInstanceOf(Collection);
                expect(chunked.first()).toBeInstanceOf(Collection);
                expect(chunked.count()).toBe(4);
                expect(chunked.get(0)!.values().toArray()).toEqual([1, 2, 3]);
                // docs/php-parity/task-24-data-release-readiness.json, "collection-chunk-last-chunk-keys"
                expect(chunked.get(3)?.all()).toEqual({ 9: 10 });
            });

            it("test chunk when given zero as size", () => {
                // CollectionTest::testChunkWhenGivenZeroAsSize
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

                expect(data.chunk(0).toArray()).toEqual([]);
            });

            it("test chunck when given less than zero", () => {
                // CollectionTest::testChunkWhenGivenLessThanZero
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

                expect(data.chunk(-1).toArray()).toEqual([]);
            });

            it("test chunk preserving keys", () => {
                // CollectionTest::testChunkPreservingKeys
                const data = collect({ a: 1, b: 2, c: 3, d: 4, e: 5 });

                expect(data.chunk(2).toArray()).toEqual([
                    { a: 1, b: 2 },
                    { c: 3, d: 4 },
                    { e: 5 },
                ]);

                const data2 = collect([1, 2, 3, 4, 5]);

                expect(data2.chunk(2, false).toArray()).toEqual([
                    [1, 2],
                    [3, 4],
                    [5],
                ]);
            });
        });

        it("numbers each chunk from 0, as a list, when it does not preserve keys", () => {
            const chunks = collect({ a: 1, b: 2, c: 3 }).chunk(2, false);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-chunk-assoc-no-preserve"
            expect(chunks.map((chunk) => viewsOf(chunk)).all()).toEqual([
                { all: [1, 2], keys: [0, 1], values: [1, 2] },
                { all: [3], keys: [0], values: [3] },
            ]);
        });

        it("drops a fraction from the size, as array_chunk's int parameter does", () => {
            const numbers = collect([1, 2, 3, 4, 5]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-chunk-fractional-size"
            expect(
                numbers
                    .chunk(2.5)
                    .map((chunk) => [chunk.keys().all(), chunk.values().all()])
                    .all(),
            ).toEqual([
                [
                    [0, 1],
                    [1, 2],
                ],
                [
                    [2, 3],
                    [3, 4],
                ],
                [[4], [5]],
            ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-chunk-counts"
            expect(
                numbers
                    .chunk(1.5)
                    .map((chunk) => chunk.values().all())
                    .all(),
            ).toEqual([[1], [2], [3], [4], [5]]);
        });

        it("throws array_chunk's error for a size that drops to 0", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-chunk-counts"
            expect(() => collect([1, 2, 3, 4, 5]).chunk(0.5)).toThrowError(
                "array_chunk(): Argument #2 ($length) must be greater than 0",
            );
        });

        it("throws array_chunk's TypeError for a size that is NAN, infinite or beyond PHP's int range", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-chunk-counts"
            for (const numbers of [collect([1, 2, 3, 4, 5]), collect([])]) {
                for (const size of [NaN, Infinity, 1e19]) {
                    expect(() => numbers.chunk(size)).toThrowError(TypeError);
                    expect(() => numbers.chunk(size)).toThrowError(
                        "array_chunk(): Argument #2 ($length) must be of type int, float given",
                    );
                }
            }
        });

        it("chunks nothing for a size of -INF, as for any size at or below 0", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-chunk-counts"
            expect(collect([1, 2, 3, 4, 5]).chunk(-Infinity).all()).toEqual([]);
        });

        it.fails(
            "chunks a Map-built collection in the order it holds its items",
            () => {
                const chunks = outOfOrderKeys().chunk(2);

                // Ordered-backing gap: PHP's first chunk holds 2 => c then 0 => a, and its second 1 => b
                // docs/php-parity/task-30-map-order.json, "chunk-out-of-order"
                expect(
                    chunks
                        .map((chunk) => [
                            chunk.keys().all(),
                            chunk.values().all(),
                        ])
                        .all(),
                ).toEqual([
                    [
                        [2, 0],
                        ["c", "a"],
                    ],
                    [[1], ["b"]],
                ]);
            },
        );

        it.fails(
            "chunks a Map-built collection's values in the order it holds them when it does not preserve keys",
            () => {
                const chunks = outOfOrderKeys().chunk(2, false);

                // Ordered-backing gap: PHP's chunks are the lists [c, a] and [b], in the order the items are held
                // docs/php-parity/task-30-map-order.json, "chunk-out-of-order-renumbered"
                expect(chunks.map((chunk) => chunk.all()).all()).toEqual([
                    ["c", "a"],
                    ["b"],
                ]);
            },
        );
    });

    describe("chunkWhile", () => {
        describe("Laravel Tests", () => {
            // docs/php-parity/task-21-chunk-while-by.json — array-backed chunks are reindexed,
            // so the numeric-key assertions from CollectionTest go through .toArray() on the chunk.
            // Read chunks with get(n): first()/last() resolve to `unknown`, so calling a method on them fails ts:check.
            it("test chunk while on equal elements", () => {
                // CollectionTest::testChunkWhileOnEqualElements
                const data = collect([
                    "A",
                    "A",
                    "B",
                    "B",
                    "C",
                    "C",
                    "C",
                ]).chunkWhile(
                    (current, _key, chunk) => chunk.last() === current,
                );

                expect(data).toBeInstanceOf(Collection);
                expect(data.first()).toBeInstanceOf(Collection);
                expect(data.get(0)!.toArray()).toEqual(["A", "A"]);
                expect(data.get(1)!.toArray()).toEqual(["B", "B"]);
                expect(data.get(2)!.toArray()).toEqual(["C", "C", "C"]);
            });

            it("test chunk while on contiguously increasing integers", () => {
                // CollectionTest::testChunkWhileOnContiguouslyIncreasingIntegers
                const data = collect([
                    1, 4, 9, 10, 11, 12, 15, 16, 19, 20, 21,
                ]).chunkWhile(
                    (current, _key, chunk) =>
                        (chunk.last() as number) + 1 === current,
                );

                expect(data).toBeInstanceOf(Collection);
                expect(data.first()).toBeInstanceOf(Collection);
                expect(data.get(0)!.toArray()).toEqual([1]);
                expect(data.get(1)!.toArray()).toEqual([4]);
                expect(data.get(2)!.toArray()).toEqual([9, 10, 11, 12]);
                expect(data.get(3)!.toArray()).toEqual([15, 16]);
                expect(data.get(4)!.toArray()).toEqual([19, 20, 21]);
            });

            it("test chunk while preserving string keys", () => {
                // CollectionTest::testChunkWhilePreservingStringKeys
                const data = collect({
                    a: 1,
                    b: 1,
                    c: 2,
                    d: 2,
                    e: 3,
                    f: 3,
                    g: 3,
                }).chunkWhile(
                    (current, _key, chunk) => chunk.last() === current,
                );

                expect(data).toBeInstanceOf(Collection);
                expect(data.first()).toBeInstanceOf(Collection);
                expect(data.get(0)!.toArray()).toEqual({ a: 1, b: 1 });
                expect(data.get(1)!.toArray()).toEqual({ c: 2, d: 2 });
                expect(data.get(2)!.toArray()).toEqual({ e: 3, f: 3, g: 3 });
            });
        });

        it("hands the callback the chunk so far as a collection", () => {
            const seen: unknown[][] = [];

            collect({ x: 10, y: 11, z: 20 }).chunkWhile(
                (current, key, chunk) => {
                    seen.push([current, key, chunk.toArray()]);

                    return (chunk.last() as number) + 1 === current;
                },
            );

            expect(seen).toEqual([
                [11, "y", { x: 10 }],
                [20, "z", { x: 10, y: 11 }],
            ]);
        });

        it("returns an empty collection for an empty collection", () => {
            const data = collect([]).chunkWhile(() => true);

            expect(data).toBeInstanceOf(Collection);
            expect(data.count()).toBe(0);
        });

        it.fails(
            "walks a Map-built collection in the order it holds its items",
            () => {
                const chunks = outOfOrderKeys().chunkWhile(() => false);

                // Ordered-backing gap: PHP chunks 2 => c first, then 0 => a, then 1 => b
                // docs/php-parity/task-30-map-order.json, "chunkWhile-out-of-order-never"
                expect(
                    chunks
                        .map((chunk) => [
                            chunk.keys().all(),
                            chunk.values().all(),
                        ])
                        .all(),
                ).toEqual([
                    [[2], ["c"]],
                    [[0], ["a"]],
                    [[1], ["b"]],
                ]);
            },
        );
    });

    describe("chunkBy", () => {
        describe("Laravel Tests", () => {
            // docs/php-parity/task-21-chunk-while-by.json
            it("test chunk by with callback", () => {
                // CollectionTest::testChunkByWithCallback
                const data = collect([1, 1, 2, 2, 3, 3, 3]).chunkBy(
                    (value) => value,
                );

                expect(data).toBeInstanceOf(Collection);
                expect(data.first()).toBeInstanceOf(Collection);
                expect(data.get(0)!.toArray()).toEqual([1, 1]);
                expect(data.get(1)!.toArray()).toEqual([2, 2]);
                expect(data.get(2)!.toArray()).toEqual([3, 3, 3]);
            });

            it("test chunk by with string key", () => {
                // CollectionTest::testChunkByWithStringKey
                const data = collect([
                    { parent: "a", name: "1" },
                    { parent: "a", name: "2" },
                    { parent: "b", name: "3" },
                    { parent: "b", name: "4" },
                    { parent: "a", name: "5" },
                ]).chunkBy("parent");

                expect(data).toBeInstanceOf(Collection);
                expect(data.count()).toBe(3);
                expect(data.get(0)!.values().toArray()).toEqual([
                    { parent: "a", name: "1" },
                    { parent: "a", name: "2" },
                ]);
                expect(data.get(1)!.values().toArray()).toEqual([
                    { parent: "b", name: "3" },
                    { parent: "b", name: "4" },
                ]);
                expect(data.get(2)!.values().toArray()).toEqual([
                    { parent: "a", name: "5" },
                ]);
            });

            it("test chunk by preserves keys", () => {
                // CollectionTest::testChunkByPreservesKeys
                const data = collect({ a: 1, b: 1, c: 2, d: 2, e: 1 }).chunkBy(
                    (value) => value,
                );

                expect(data).toBeInstanceOf(Collection);
                expect(data.count()).toBe(3);
                expect(data.get(0)!.toArray()).toEqual({ a: 1, b: 1 });
                expect(data.get(1)!.toArray()).toEqual({ c: 2, d: 2 });
                expect(data.get(2)!.toArray()).toEqual({ e: 1 });
            });

            it("test chunk by with dot notation", () => {
                // CollectionTest::testChunkByWithDotNotation
                const data = collect([
                    { address: { city: "NY" } },
                    { address: { city: "NY" } },
                    { address: { city: "LA" } },
                ]).chunkBy("address.city");

                expect(data.count()).toBe(2);
                expect(data.get(0)!.count()).toBe(2);
                expect(data.get(1)!.count()).toBe(1);
            });

            it("test chunk by with empty collection", () => {
                // CollectionTest::testChunkByWithEmptyCollection
                const data = collect([]).chunkBy("key");

                expect(data).toBeInstanceOf(Collection);
                expect(data.count()).toBe(0);
            });

            it("test chunk by with single item", () => {
                // CollectionTest::testChunkByWithSingleItem
                const data = collect([{ key: "a" }]).chunkBy("key");

                expect(data).toBeInstanceOf(Collection);
                expect(data.count()).toBe(1);
                expect(data.get(0)!.values().toArray()).toEqual([{ key: "a" }]);
            });
        });

        it("compares adjacent values loosely, as PHP's == does", () => {
            const data = collect([
                1,
                "1",
                2,
                "2",
                null,
                0,
                "",
                false,
                "a",
                "A",
            ]).chunkBy((value) => value);

            expect(data.map((chunk) => chunk.toArray()).toArray()).toEqual([
                [1, "1"],
                [2, "2"],
                [null, 0],
                ["", false],
                ["a"],
                ["A"],
            ]);
        });

        it("chunks an object-backed collection by a bare string key", () => {
            // The obj path: a bare (non-dotted) key has to resolve on a plain object item, keys preserved.
            const data = collect({
                p: { parent: "a" },
                q: { parent: "a" },
                r: { parent: "b" },
            }).chunkBy("parent");

            expect(data.count()).toBe(2);
            expect(data.get(0)!.toArray()).toEqual({
                p: { parent: "a" },
                q: { parent: "a" },
            });
            expect(data.get(1)!.toArray()).toEqual({ r: { parent: "b" } });
        });

        it("agrees between array-backed and object-backed collections", () => {
            const fromArray = collect([1, 1, 2]).chunkBy((value) => value);
            const fromObject = collect({ a: 1, b: 1, c: 2 }).chunkBy(
                (value) => value,
            );

            expect(
                fromArray.map((chunk) => chunk.values().toArray()).toArray(),
            ).toEqual(
                fromObject.map((chunk) => chunk.values().toArray()).toArray(),
            );
            expect(fromObject.get(0)!.toArray()).toEqual({ a: 1, b: 1 });
        });

        it.fails(
            "walks a Map-built collection in the order it holds its items",
            () => {
                const chunks = outOfOrderKeys().chunkBy((value) => value);

                // Ordered-backing gap: PHP chunks 2 => c first, then 0 => a, then 1 => b
                // docs/php-parity/task-30-map-order.json, "chunkBy-out-of-order"
                expect(
                    chunks
                        .map((chunk) => [
                            chunk.keys().all(),
                            chunk.values().all(),
                        ])
                        .all(),
                ).toEqual([
                    [[2], ["c"]],
                    [[0], ["a"]],
                    [[1], ["b"]],
                ]);
            },
        );
    });

    describe("sort", () => {
        it("sorts by a comparator answering a bool, as uasort() falls back for one", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sort-bool-comparator"
            const list = collect([3, 1, 2]).sort((a, b) => a > b);

            expect(list.values().all()).toEqual([1, 2, 3]);
            // JS-only: the sort family renumbers integer keys, where PHP keeps 1, 2 and 0
            expect(list.all()).toEqual([1, 2, 3]);
            expect(list.keys().all()).toEqual([0, 1, 2]);

            const keyed = collect({ x: 3, y: 1, z: 2 }).sort((a, b) => a > b);

            expect(keyed.all()).toEqual({ y: 1, z: 2, x: 3 });
            expect(keyed.keys().all()).toEqual(["y", "z", "x"]);
            expect(keyed.values().all()).toEqual([1, 2, 3]);
        });

        it("casts a comparator answer past PHP's int range to its low 64 bits, so 1e19 sorts backwards", () => {
            const sorted = collect([3, 1, 2]).sort(
                (a, b) => Math.sign(a - b) * 1e19,
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sort-comparator-past-int-range"
            expect(sorted.values().all()).toEqual([3, 2, 1]);
            // JS-only: the sort family renumbers integer keys, where PHP keeps 0, 2 and 1
            expect(sorted.keys().all()).toEqual([0, 1, 2]);
        });

        describe("Laravel Tests", () => {
            it("test sort", () => {
                // CollectionTest::testSort
                const data = collect([5, 3, 1, 2, 4]).sort();
                expect(data.values().all()).toEqual([1, 2, 3, 4, 5]);

                const data2 = collect([
                    -1, -3, -2, -4, -5, 0, 5, 3, 1, 2, 4,
                ]).sort();
                expect(data2.values().all()).toEqual([
                    -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5,
                ]);

                const data3 = collect(["foo", "bar-10", "bar-1"]).sort();
                expect(data3.values().all()).toEqual([
                    "bar-1",
                    "bar-10",
                    "foo",
                ]);

                const data4 = collect(["T2", "T1", "T10"]).sort();
                expect(data4.values().all()).toEqual(["T1", "T10", "T2"]);

                // $data = (new $collection(['T2', 'T1', 'T10']))->sort(SORT_NATURAL);
                // $this->assertEquals(['T1', 'T2', 'T10'], $data->values()->all());
                // Note: JavaScript doesn't have SORT_NATURAL flag like PHP, so we skip this test case
                // Natural sorting would require a different implementation with localeCompare numeric option
            });

            it("test sort with callback", () => {
                // CollectionTest::testSortWithCallback
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sort-comparator"
                const data = collect([5, 3, 1, 2, 4]).sort((a, b) => a - b);

                expect(Object.values(data.all())).toEqual([1, 2, 3, 4, 5]);
            });
        });

        it("runs a callback as a comparator of two items, as uasort does", () => {
            const sorted = collect([5, 3, 1, 2, 4]).sort((a, b) => b - a);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sort-comparator-desc"
            expect(sorted.values().all()).toEqual([5, 4, 3, 2, 1]);
            // JS-only: the sort family renumbers integer keys, so a list stays a list
            expect(sorted.all()).toEqual([5, 4, 3, 2, 1]);
            expect(sorted.keys().all()).toEqual([0, 1, 2, 3, 4]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sort-comparator-rows"
            expect(
                collect([{ n: 2 }, { n: 1 }, { n: 3 }])
                    .sort((a, b) => a.n - b.n)
                    .values()
                    .all(),
            ).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
        });

        it("keeps string keys through a comparator sort", () => {
            const sorted = collect({ a: 3, b: 1, c: 2 }).sort((x, y) => x - y);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sort-comparator-assoc"
            expect(sorted.all()).toEqual({ b: 1, c: 2, a: 3 });
            expect(sorted.keys().all()).toEqual(["b", "c", "a"]);
            expect(sorted.values().all()).toEqual([1, 2, 3]);
        });

        it("casts a comparator's answer to an int, as uasort does, so a fraction or a non-finite answer ties", () => {
            const numbers = collect([3, 1, 2]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sort-comparator-int-cast"
            expect(
                numbers
                    .sort((a, b) => (a - b) / 10)
                    .values()
                    .all(),
            ).toEqual([3, 1, 2]);
            expect(
                numbers
                    .sort((a, b) => Math.sign(a - b) * Infinity)
                    .values()
                    .all(),
            ).toEqual([3, 1, 2]);
            expect(
                numbers
                    .sort(() => NaN)
                    .values()
                    .all(),
            ).toEqual([3, 1, 2]);
        });

        it("keeps a Map-built collection's ties in the order it holds them", () => {
            const sorted = collect(
                new Map([
                    [2, { n: 1, id: "p" }],
                    [0, { n: 1, id: "q" }],
                    [1, { n: 0, id: "r" }],
                ]),
            ).sort((a, b) => a.n - b.n);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sort-comparator-out-of-order"
            expect(sorted.pluck("id").all()).toEqual(["r", "p", "q"]);
            // JS-only: the sort family renumbers integer keys, where PHP keeps 1, 2 and 0
            expect(sorted.keys().all()).toEqual([0, 1, 2]);
        });

        it.fails(
            "keeps a string key ahead of an integer one when the comparator puts it there",
            () => {
                const sorted = collect({ 0: 1, x: 2 }).sort((a, b) => b - a);

                // Ordered-backing gap: PHP keeps x => 2 ahead of 0 => 1; a plain object lists its integer key first
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sort-desc-mixed-keys"
                expect([sorted.keys().all(), sorted.values().all()]).toEqual([
                    ["x", 0],
                    [2, 1],
                ]);
            },
        );

        // task-19-spaceship.json, "Collection::sort orders numeric strings
        // numerically", "Collection::sortDesc ...", "Collection::sortBy(null)
        // ..." and "Collection::sortByDesc(null) ..."
        it("orders numeric strings numerically through every sort entry point", () => {
            const mixed = ["9", "10", "1", 5];
            const ascending = ["1", 5, "9", "10"];
            const descending = ["10", "9", 5, "1"];

            expect(collect(mixed).sort().values().all()).toEqual(ascending);
            expect(collect(mixed).sortDesc().values().all()).toEqual(
                descending,
            );
            expect(collect(mixed).sortBy(null).values().all()).toEqual(
                ascending,
            );
            expect(collect(mixed).sortByDesc(null).values().all()).toEqual(
                descending,
            );
        });

        // task-19-spaceship.json, "Collection::sortBy([key]) orders numeric
        // strings numerically"
        it("orders numeric strings numerically through sortByMany", () => {
            const rows = [{ n: "9" }, { n: "10" }, { n: "1" }, { n: 5 }];

            expect(collect(rows).sortBy(["n"]).pluck("n").all()).toEqual([
                "1",
                5,
                "9",
                "10",
            ]);
        });
    });

    describe("sortDesc", () => {
        describe("Laravel Tests", () => {
            it("test sort desc", () => {
                // CollectionTest::testSortDesc
                const data = collect([5, 3, 1, 2, 4]).sortDesc();
                expect(data.values().all()).toEqual([5, 4, 3, 2, 1]);

                const data2 = collect([
                    -1, -3, -2, -4, -5, 0, 5, 3, 1, 2, 4,
                ]).sortDesc();
                expect(data2.values().all()).toEqual([
                    5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5,
                ]);

                const data3 = collect(["bar-1", "foo", "bar-10"]).sortDesc();
                expect(data3.values().all()).toEqual([
                    "foo",
                    "bar-10",
                    "bar-1",
                ]);

                const data4 = collect(["T2", "T1", "T10"]).sortDesc();
                expect(data4.values().all()).toEqual(["T2", "T10", "T1"]);
            });
        });

        it("sorts an integer-keyed object instead of silently no-opping", () => {
            // PHP-verified (task-10-pluck-sort.json, "sort/sortDesc/reverse preserve
            // integer keys and their order"): sort_values [1,2,3], sortdesc_values [3,2,1].
            // PHP keeps the names (sortdesc_all {"0":3,"2":2,"1":1}); JS renumbers instead.
            const c = new Collection({ 0: 3, 1: 1, 2: 2 });
            expect(c.sortDesc().values().all()).toEqual([3, 2, 1]);
            expect(c.sortDesc().all()).toEqual({ 0: 3, 1: 2, 2: 1 });
            expect(c.sort().values().all()).toEqual([1, 2, 3]);
        });

        it.fails(
            "keeps a string key ahead of an integer one when its value is larger",
            () => {
                const sorted = collect({ 0: 1, x: 2 }).sortDesc();

                // Ordered-backing gap: PHP keeps x => 2 ahead of 0 => 1; a plain object lists its integer key first
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sort-desc-mixed-keys"
                expect([sorted.keys().all(), sorted.values().all()]).toEqual([
                    ["x", 0],
                    [2, 1],
                ]);
            },
        );
    });

    describe("sortBy", () => {
        it("reads a comparator's answer as uasort() reads the whole closure's, a bool falling back and a fraction tying", () => {
            type Row = { x: number; y?: number };
            const tied = (): Row[] => [
                { x: 1, y: 2 },
                { x: 1, y: 1 },
            ];

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortBy-bool-comparator"
            expect(
                collect<Row>([{ x: 3 }, { x: 1 }, { x: 2 }])
                    .sortBy([(p: Row, q: Row) => p.x > q.x])
                    .values()
                    .all(),
            ).toEqual([{ x: 1 }, { x: 2 }, { x: 3 }]);
            expect(
                collect(tied())
                    .sortBy([(p: Row, q: Row) => p.x > q.x, "y"])
                    .values()
                    .all(),
            ).toEqual(tied());
            expect(
                collect(tied())
                    .sortBy([() => 0, "y"])
                    .values()
                    .all(),
            ).toEqual([
                { x: 1, y: 1 },
                { x: 1, y: 2 },
            ]);
            expect(
                collect(tied())
                    .sortBy([() => 0.5, "y"])
                    .values()
                    .all(),
            ).toEqual(tied());
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortByDesc-bool-comparator"
            expect(
                collect([3, 1, 2])
                    .sortByDesc([(a: number, b: number) => a > b])
                    .values()
                    .all(),
            ).toEqual([1, 2, 3]);
        });

        it("orders numbers and numeric strings by value", () => {
            // CollectionTest::testSortByManyWithNumericFlagComparesFractionalValues, without SORT_NUMERIC, which orders
            // this data the same. docs/php-parity/task-31-laravel-13-33-sync.json, "sortBy-many-default-flag-asc",
            // "sortBy-many-default-flag-desc" and "sortBy-key-default-flag"
            const prices = collect([
                { price: 1.5 },
                { price: "10.5" },
                { price: 1.2 },
                { price: "10.2" },
                { price: 1.9 },
            ]);

            expect(
                prices
                    .sortBy([["price", "asc"]])
                    .pluck("price")
                    .values()
                    .all(),
            ).toEqual([1.2, 1.5, 1.9, "10.2", "10.5"]);
            expect(
                prices
                    .sortBy([["price", "desc"]])
                    .pluck("price")
                    .values()
                    .all(),
            ).toEqual(["10.5", "10.2", 1.9, 1.5, 1.2]);
            expect(
                prices.sortBy("price").pluck("price").values().all(),
            ).toEqual(
                prices
                    .sortBy([["price", "asc"]])
                    .pluck("price")
                    .values()
                    .all(),
            );
        });

        it("keeps a Map-built collection's ties in the order it holds them", () => {
            const rows = () =>
                collect(
                    new Map([
                        [2, { n: 1, id: "p" }],
                        [0, { n: 1, id: "q" }],
                        [1, { n: 0, id: "r" }],
                    ]),
                );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortBy-out-of-order-ties"
            expect(rows().sortBy("n").pluck("id").all()).toEqual([
                "r",
                "p",
                "q",
            ]);
            expect(rows().sortByDesc("n").pluck("id").all()).toEqual([
                "p",
                "q",
                "r",
            ]);
            expect(rows().sortBy(["n"]).pluck("id").all()).toEqual([
                "r",
                "p",
                "q",
            ]);
        });

        it.fails(
            "keeps a string key ahead of an integer one through sortByDesc",
            () => {
                const sorted = collect({ 0: 1, x: 2 }).sortByDesc(
                    (value) => value,
                );

                // Ordered-backing gap: PHP keeps x => 2 ahead of 0 => 1; a plain object lists its integer key first
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sort-desc-mixed-keys"
                expect([sorted.keys().all(), sorted.values().all()]).toEqual([
                    ["x", 0],
                    [2, 1],
                ]);
            },
        );

        it("keeps ties in their original relative order through sortByDesc", () => {
            const items = collect([
                { id: "a", k: 2 },
                { id: "b", k: 1 },
                { id: "c", k: 2 },
                { id: "d", k: 3 },
            ]);

            // docs/php-parity/task-12-regression-pins.json,
            // "sortDesc ties fall back to original order, not a full reverse"
            expect(
                items
                    .sortByDesc((item) => item.k)
                    .pluck("id")
                    .values()
                    .all(),
            ).toEqual(["d", "a", "c", "b"]);
        });

        it("keeps all() and values() in agreement over integer keys", () => {
            // PHP-verified (task-10-pluck-sort.json, "sortBy/sortByDesc: all() and
            // values() agree on order"): sortby_values and sortbymany_values are
            // [{v:1},{v:2},{v:3}], sortbydesc_values [{v:3},{v:2},{v:1}].
            const c = new Collection({
                0: { v: 3 },
                1: { v: 1 },
                2: { v: 2 },
            });

            expect(Object.values(c.sortBy("v").all())).toEqual(
                c.sortBy("v").values().all(),
            );
            expect(c.sortBy("v").values().all()).toEqual([
                { v: 1 },
                { v: 2 },
                { v: 3 },
            ]);

            expect(Object.values(c.sortByDesc("v").all())).toEqual(
                c.sortByDesc("v").values().all(),
            );
            expect(c.sortByDesc("v").values().all()).toEqual([
                { v: 3 },
                { v: 2 },
                { v: 1 },
            ]);

            expect(Object.values(c.sortBy([["v"]]).all())).toEqual(
                c
                    .sortBy([["v"]])
                    .values()
                    .all(),
            );
            expect(
                c
                    .sortBy([["v"]])
                    .values()
                    .all(),
            ).toEqual([{ v: 1 }, { v: 2 }, { v: 3 }]);
        });

        describe("Laravel Tests", () => {
            it("test sort by", () => {
                // CollectionTest::testSortBy
                const data = collect(["taylor", "dayle"]);
                const sorted = data.sortBy((x) => x);

                expect(sorted.values().all()).toEqual(["dayle", "taylor"]);

                const data2 = collect(["dayle", "taylor"]);
                const sorted2 = data2.sortByDesc((x) => x);

                expect(sorted2.values().all()).toEqual(["taylor", "dayle"]);
            });

            it("test sort by string", () => {
                // CollectionTest::testSortByString
                const data = collect([{ name: "taylor" }, { name: "dayle" }]);
                const sorted = data.sortBy("name");

                expect(sorted.values().all()).toEqual([
                    { name: "dayle" },
                    { name: "taylor" },
                ]);

                const data2 = collect([{ name: "taylor" }, { name: "dayle" }]);
                const sorted2 = data2.sortBy("name", true);

                expect(sorted2.values().all()).toEqual([
                    { name: "taylor" },
                    { name: "dayle" },
                ]);
            });

            it("test sort by callable string", () => {
                // CollectionTest::testSortByCallableString
                const data = collect([{ sort: 2 }, { sort: 1 }]);
                const sorted = data.sortBy([["sort", "asc"]]);

                expect(Object.values(sorted.all())).toEqual([
                    { sort: 1 },
                    { sort: 2 },
                ]);
            });

            it("test sort by callable string desc", () => {
                // CollectionTest::testSortByCallableStringDesc
                let data = collect([
                    { id: 1, name: "foo" },
                    { id: 2, name: "bar" },
                ]);
                data = data.sortByDesc(["id"]);
                expect(Object.values(data.all())).toEqual([
                    { id: 2, name: "bar" },
                    { id: 1, name: "foo" },
                ]);

                data = collect([
                    { id: 1, name: "foo" },
                    { id: 2, name: "bar" },
                    { id: 2, name: "baz" },
                ]);
                data = data.sortByDesc(["id"]);
                expect(Object.values(data.all())).toEqual([
                    { id: 2, name: "bar" },
                    { id: 2, name: "baz" },
                    { id: 1, name: "foo" },
                ]);

                data = data.sortByDesc(["id", "name"]);
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortByDesc-id-then-name"
                expect(Object.values(data.all())).toEqual([
                    { id: 2, name: "baz" },
                    { id: 2, name: "bar" },
                    { id: 1, name: "foo" },
                ]);
            });

            it("test value retriever accepts dot notation", () => {
                // CollectionTest::testValueRetrieverAcceptsDotNotation
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortBy-dot-path"
                const c = collect([
                    { id: 1, foo: { bar: "B" } },
                    { id: 2, foo: { bar: "A" } },
                ]).sortBy("foo.bar");

                expect(c.pluck("id").all()).toEqual([2, 1]);
            });

            it("test sort by always returns assoc", () => {
                // CollectionTest::testSortByAlwaysReturnsAssoc
                const data = collect({ a: "taylor", b: "dayle" });
                const sorted = data.sortBy((x) => x);

                expect(sorted.all()).toEqual({ b: "dayle", a: "taylor" });
                expect(sorted.keys().all()).toEqual(["b", "a"]);

                const data2 = collect(["taylor", "dayle"]);
                const sorted2 = data2.sortBy((x) => x);

                // JS-only: the sort family renumbers integer keys, where PHP keeps [1 => 'dayle', 0 => 'taylor']
                expect(sorted2.all()).toEqual(["dayle", "taylor"]);

                const data3 = collect({ a: { sort: 2 }, b: { sort: 1 } });
                const sorted3 = data3.sortBy([["sort", "asc"]]);

                expect(sorted3.all()).toEqual({
                    b: { sort: 1 },
                    a: { sort: 2 },
                });
                expect(sorted3.keys().all()).toEqual(["b", "a"]);

                const data4 = collect([{ sort: 2 }, { sort: 1 }]);
                const sorted4 = data4.sortBy([["sort", "asc"]]);

                // JS-only: the sort family renumbers integer keys, where PHP keeps [1 => ['sort' => 1], 0 => ...]
                expect(sorted4.all()).toEqual([{ sort: 1 }, { sort: 2 }]);
            });
        });

        it("sorts by what a callback answers for each value and its key", () => {
            const sorted = collect({ x: 1, a: 2, m: 3 }).sortBy(
                (_value, key) => key,
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortBy-callback-by-key"
            expect(viewsOf(sorted)).toEqual({
                all: { a: 2, m: 3, x: 1 },
                keys: ["a", "m", "x"],
                values: [2, 3, 1],
            });
        });

        it("reads each descriptor's own direction, and sortByDesc turns every path descending", () => {
            const people = collect([
                { name: "b", age: 1 },
                { name: "a", age: 1 },
                { name: "a", age: 3 },
                { name: "b", age: 2 },
            ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortBy-descriptor-mixed-directions"
            expect(
                people
                    .sortBy([
                        ["name", "asc"],
                        ["age", "desc"],
                    ])
                    .values()
                    .all(),
            ).toEqual([
                { name: "a", age: 3 },
                { name: "a", age: 1 },
                { name: "b", age: 2 },
                { name: "b", age: 1 },
            ]);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortByDesc-descriptor-mixed-directions"
            expect(
                people
                    .sortByDesc([
                        ["name", "asc"],
                        ["age", "desc"],
                    ])
                    .values()
                    .all(),
            ).toEqual([
                { name: "b", age: 2 },
                { name: "b", age: 1 },
                { name: "a", age: 3 },
                { name: "a", age: 1 },
            ]);
        });

        it("keeps tied items in the order they came", () => {
            const rows = collect([
                { k: 1, id: "a" },
                { k: 0, id: "b" },
                { k: 1, id: "c" },
            ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortBy-ties-stable"
            expect(rows.sortBy("k").pluck("id").all()).toEqual(["b", "a", "c"]);
        });

        it("handles null == null comparison", () => {
            const c = collect([{ val: null }, { val: null }, { val: 1 }]);
            const sorted = c.sortBy("val");
            expect(sorted.values().all()).toEqual([
                { val: null },
                { val: null },
                { val: 1 },
            ]);
        });

        // task-19-spaceship.json, "spaceship on null and a positive int"
        it("orders a null value before a number", () => {
            const c = collect([{ val: null }, { val: 1 }]);
            const sorted = c.sortBy("val");
            expect(sorted.values().all()).toEqual([{ val: null }, { val: 1 }]);
        });

        it("orders a null value before a number from either side", () => {
            const c = collect([{ val: 1 }, { val: null }]);
            const sorted = c.sortBy("val");
            expect(sorted.values().all()).toEqual([{ val: null }, { val: 1 }]);
        });

        it("supports SortDirection.Descending", () => {
            // CollectionTest::testSortBy
            const data = collect(["taylor", "dayle"]);
            const sorted = data.sortBy((x) => x, SortDirection.Descending);
            expect(sorted.values().all()).toEqual(["taylor", "dayle"]);
        });

        it("supports SortDirection.Ascending", () => {
            const data = collect(["taylor", "dayle"]);
            const sorted = data.sortBy((x) => x, SortDirection.Ascending);
            expect(sorted.values().all()).toEqual(["dayle", "taylor"]);
        });

        // docs/php-parity/task-17-second-review.json, "sortBy(null) over array values"
        it("sortBy(null) orders object values the way sort() does", () => {
            const collection = new Collection({
                a: { n: 2 },
                b: { n: 1 },
                c: { n: 3 },
            });
            expect(
                collection
                    .sortBy(null as never)
                    .values()
                    .all(),
            ).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
            expect(
                collection
                    .sortBy(null as never)
                    .values()
                    .all(),
            ).toEqual(collection.sort().values().all());
        });

        // docs/php-parity/task-17-second-review.json,
        // "sortByMany falls through on an equal first key"
        it("consults the second sort key when the first ties on non-primitives", () => {
            const collection = new Collection([
                { a: [], b: 2 },
                { a: [], b: 1 },
            ]);
            expect(
                collection
                    .sortBy([
                        ["a", "asc"],
                        ["b", "asc"],
                    ] as never)
                    .values()
                    .all(),
            ).toEqual([
                { a: [], b: 1 },
                { a: [], b: 2 },
            ]);
        });

        // docs/php-parity/task-17-second-review.json,
        // "sortByMany treats 1 and \"1\" as a tie"
        it('treats 1 and "1" as a tie and falls through to the next key', () => {
            const collection = new Collection([
                { a: 1, b: 2 },
                { a: "1", b: 1 },
            ]);
            expect(
                collection
                    .sortBy([
                        ["a", "asc"],
                        ["b", "asc"],
                    ] as never)
                    .values()
                    .all(),
            ).toEqual([
                { a: "1", b: 1 },
                { a: 1, b: 2 },
            ]);
        });
    });

    describe("sortByMany", () => {
        describe("Laravel Tests", () => {
            it("test sort by many", () => {
                // CollectionTest::testSortByMany, its default-flag lines: this port takes no sort flags
                let data = collect([
                    { item: "1" },
                    { item: "10" },
                    { item: 5 },
                    { item: 20 },
                ]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortByMany-desc-direction-forms"
                data = data.sortBy(["item"]);
                expect(data.pluck("item").all()).toEqual(["1", 5, "10", 20]);

                data = data.sortBy([["item", "desc"]]);
                expect(data.pluck("item").all()).toEqual([20, "10", 5, "1"]);

                data = data.sortBy([["item", false]]);
                expect(data.pluck("item").all()).toEqual([20, "10", 5, "1"]);

                data = data.sortBy([["item", SortDirection.Descending]]);
                expect(data.pluck("item").all()).toEqual([20, "10", 5, "1"]);

                const images = collect([
                    { item: "img1" },
                    { item: "img101" },
                    { item: "img10" },
                    { item: "img11" },
                ]);

                // docs/php-parity/task-10-pluck-sort.json, "sortBy/sortByMany over an integer-keyed backing"
                expect(images.sortBy(["item"]).pluck("item").all()).toEqual([
                    "img1",
                    "img10",
                    "img101",
                    "img11",
                ]);

                const mixedCase = collect([
                    { item: "img1" },
                    { item: "Img101" },
                    { item: "img10" },
                    { item: "Img11" },
                ]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortByMany-mixed-case-default-flag"
                expect(mixedCase.sortBy(["item"]).pluck("item").all()).toEqual([
                    "Img101",
                    "Img11",
                    "img1",
                    "img10",
                ]);

                const places = collect([
                    { item: "Österreich" },
                    { item: "Oesterreich" },
                    { item: "Zeta" },
                ]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortByMany-umlaut-default-flag"
                expect(places.sortBy(["item"]).pluck("item").all()).toEqual([
                    "Oesterreich",
                    "Zeta",
                    "Österreich",
                ]);
            });

            it("test natural sort by many with null", () => {
                // CollectionTest::testNaturalSortByManyWithNull, without SORT_NATURAL, which orders these the same
                const itemFoo = { first: "f", second: null };
                const itemBar = { first: "f", second: "s" };
                const data = collect([itemFoo, itemBar]).sortBy([
                    ["first", "desc"],
                    ["second", "desc"],
                ]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortByMany-null-desc-default-flag"
                expect(data.first()).toEqual(itemBar);
                expect(data.skip(1).first()).toEqual(itemFoo);
            });
        });

        it("orders by several keys, each ascending, or each descending through sortByDesc", () => {
            const rows = collect([
                { first: "b", second: 2 },
                { first: "a", second: 3 },
                { first: "b", second: 1 },
                { first: "a", second: 1 },
            ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortByMany-two-keys"
            expect(rows.sortBy(["first", "second"]).values().all()).toEqual([
                { first: "a", second: 1 },
                { first: "a", second: 3 },
                { first: "b", second: 1 },
                { first: "b", second: 2 },
            ]);
            expect(rows.sortByDesc(["first", "second"]).values().all()).toEqual(
                [
                    { first: "b", second: 2 },
                    { first: "b", second: 1 },
                    { first: "a", second: 3 },
                    { first: "a", second: 1 },
                ],
            );
        });

        it("orders a null below a string, whichever way the keys sort", () => {
            const rows = collect([
                { first: "f", second: null },
                { first: "f", second: "s" },
                { first: "a", second: "z" },
            ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortByMany-null-values"
            expect(rows.sortBy(["first", "second"]).values().all()).toEqual([
                { first: "a", second: "z" },
                { first: "f", second: null },
                { first: "f", second: "s" },
            ]);
            expect(rows.sortByDesc(["first", "second"]).values().all()).toEqual(
                [
                    { first: "f", second: "s" },
                    { first: "f", second: null },
                    { first: "a", second: "z" },
                ],
            );
        });

        it("falls through to the next key on a tie, and keeps the order when every key ties", () => {
            const firstKeyTies = collect([
                { primary: "a", secondary: 3 },
                { primary: "a", secondary: 1 },
                { primary: "b", secondary: 2 },
            ]);
            const bothKeysTie = collect([
                { primary: "a", secondary: 1 },
                { primary: "a", secondary: 1 },
                { primary: "b", secondary: 2 },
            ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortByMany-two-keys"
            expect(
                firstKeyTies.sortBy(["primary", "secondary"]).values().all(),
            ).toEqual([
                { primary: "a", secondary: 1 },
                { primary: "a", secondary: 3 },
                { primary: "b", secondary: 2 },
            ]);
            expect(
                bothKeysTie.sortBy(["primary", "secondary"]).values().all(),
            ).toEqual([
                { primary: "a", secondary: 1 },
                { primary: "a", secondary: 1 },
                { primary: "b", secondary: 2 },
            ]);
        });

        it("sorts nothing for no comparisons", () => {
            // docs/php-parity/task-11-final-fixes.json, "sortBy with no comparisons leaves the order alone"
            expect(collect([3, 1, 2]).sortBy([]).all()).toEqual([3, 1, 2]);
        });

        it("runs a comparator given among the comparisons", () => {
            // docs/php-parity/task-10-pluck-sort.json, "sortBy/sortByMany over an integer-keyed backing" (vals_plucked)
            expect(
                collect([{ value: 10 }, { value: 5 }, { value: 20 }])
                    .sortBy([(a, b) => a.value - b.value])
                    .pluck("value")
                    .all(),
            ).toEqual([5, 10, 20]);

            // Same row, nums_values. JS-only: the sort family renumbers integer keys, where nums_all keeps 1, 2, 0
            expect(
                collect([3, 1, 2])
                    .sortBy([(a, b) => a - b])
                    .all(),
            ).toEqual([1, 2, 3]);
        });

        it("supports per-comparison SortDirection tuple descending", () => {
            const data = collect([
                { name: "alice", age: 30 },
                { name: "bob", age: 25 },
                { name: "carol", age: 35 },
            ]);
            const sorted = data.sortBy([["name", SortDirection.Descending]]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortBy-descriptor-direction-forms"
            expect(sorted.values().pluck("name").all()).toEqual([
                "carol",
                "bob",
                "alice",
            ]);
        });

        it("supports per-comparison SortDirection.Descending string value tuple", () => {
            const data = collect([{ val: 10 }, { val: 30 }, { val: 20 }]);
            const sorted = data.sortBy([["val", "Descending"]]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortBy-descriptor-direction-forms"
            expect(sorted.values().pluck("val").all()).toEqual([30, 20, 10]);
        });

        it("supports per-comparison false tuple (descending)", () => {
            const data = collect([{ val: 1 }, { val: 3 }, { val: 2 }]);
            const sorted = data.sortBy([["val", false]]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortBy-descriptor-direction-forms"
            expect(sorted.values().pluck("val").all()).toEqual([3, 2, 1]);
        });

        it("supports per-comparison SortDirection.Ascending tuple", () => {
            const data = collect([
                { name: "carol" },
                { name: "alice" },
                { name: "bob" },
            ]);
            const sorted = data.sortBy([["name", SortDirection.Ascending]]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortBy-descriptor-direction-forms"
            expect(sorted.values().pluck("name").all()).toEqual([
                "alice",
                "bob",
                "carol",
            ]);
        });

        it('sorts a direction spelled "Ascending" ascending, since SortDirection.Ascending is that string', () => {
            const data = collect([{ val: 30 }, { val: 10 }, { val: 20 }]);
            const sorted = data.sortBy([["val", "Ascending"]]);

            // JS-only: the enum case is the string, which PHP's match sends to its descending default arm
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortBy-string-Ascending-direction"
            expect(sorted.values().pluck("val").all()).toEqual([10, 20, 30]);
        });

        it("supports mixed per-comparison directions", () => {
            const data = collect([
                { group: "a", rank: 2 },
                { group: "a", rank: 1 },
                { group: "b", rank: 3 },
                { group: "b", rank: 4 },
            ]);
            const sorted = data.sortBy([
                ["group", SortDirection.Ascending],
                ["rank", SortDirection.Descending],
            ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortBy-descriptor-direction-forms"
            expect(sorted.values().all()).toEqual([
                { group: "a", rank: 2 },
                { group: "a", rank: 1 },
                { group: "b", rank: 4 },
                { group: "b", rank: 3 },
            ]);
        });

        it("supports the lowercase 'desc'/'asc' string direction forms", () => {
            const data = collect([{ age: 2 }, { age: 10 }]);

            // docs/php-parity/task-10-pluck-sort.json,
            // "Collection::sortBy — string \"desc\" direction sorts descending"
            const desc = data.sortBy([["age", "desc"]]);
            expect(desc.values().pluck("age").all()).toEqual([10, 2]);

            // docs/php-parity/task-18-sort-comparator.json, "direction tuple [age,\"asc\"] — string form"
            const asc = data.sortBy([["age", "asc"]]);
            expect(asc.values().pluck("age").all()).toEqual([2, 10]);
        });

        it("falls through an unrecognized direction to descending (default arm)", () => {
            // docs/php-parity/task-10-pluck-sort.json,
            // "Collection::sortBy — unrecognized direction sorts descending (default arm)"
            const data = collect([{ age: 2 }, { age: 10 }]);
            const sorted = data.sortBy([["age", "BOGUS" as unknown as "asc"]]);
            expect(sorted.values().pluck("age").all()).toEqual([10, 2]);
        });

        it("ignores a global descending flag on sortBy for the array-of-descriptors form", () => {
            // PHP-verified: docs/php-parity/task-10-pluck-sort.json,
            // "Collection::sortBy — global $descending=true is ignored for the
            // array-of-descriptors form".
            const data = collect([{ age: 10 }, { age: 2 }]);
            const sorted = data.sortBy([["age"]], true);
            expect(sorted.values().pluck("age").all()).toEqual([2, 10]);
        });

        it("sortByDesc overrides a descriptor's own direction, but never a comparator's", () => {
            const data = collect([{ age: 2 }, { age: 10 }]);

            // docs/php-parity/task-18-sort-comparator.json, "sortDesc overrides an explicit \"asc\" direction"
            const forced = data.sortByDesc([["age", "asc"]]);
            expect(forced.values().pluck("age").all()).toEqual([10, 2]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortBy-descriptor-direction-forms"
            const withComparator = data.sortByDesc([
                (a: { age: number }, b: { age: number }) => a.age - b.age,
            ]);
            expect(withComparator.values().pluck("age").all()).toEqual([2, 10]);
        });

        it("runs a comparator nested in a one-element descriptor", () => {
            // PHP-verified: docs/php-parity/task-18-sort-comparator.json,
            // "sortBy runs a comparator nested in a one-element descriptor" and
            // "sortBy treats [[fn]] and [fn] the same".
            const byAge = (a: { age: number }, b: { age: number }) =>
                a.age - b.age;
            const data = collect([{ age: 3 }, { age: 1 }, { age: 2 }]);

            expect(
                data
                    .sortBy([[byAge]] as never)
                    .values()
                    .all(),
            ).toEqual([{ age: 1 }, { age: 2 }, { age: 3 }]);
            expect(
                data
                    .sortBy([[byAge]] as never)
                    .values()
                    .all(),
            ).toEqual(data.sortBy([byAge]).values().all());
        });

        it("sortByDesc forces a bare-key array descriptor descending", () => {
            // Pins the array-form JSDoc example as an executable test: sortByDesc(['id'])
            // must sort descending on its own, without sortBy forwarding a global flag.
            const data = collect([{ id: 2 }, { id: 1 }, { id: 10 }]);
            const sorted = data.sortByDesc(["id"]);
            expect(sorted.values().pluck("id").all()).toEqual([10, 2, 1]);
        });
    });

    describe("sortKeys", () => {
        describe("Laravel Tests", () => {
            it("test sort keys", () => {
                // CollectionTest::testSortKeys
                const data = collect({ b: "dayle", a: "taylor" });

                expect(data.sortKeys().all()).toEqual({
                    a: "taylor",
                    b: "dayle",
                });
            });
        });

        it("test coverage sortKeys", () => {
            // Test descending order
            const data = collect({ c: 3, a: 1, b: 2 });
            expect(data.sortKeys(true).all()).toEqual({
                c: 3,
                b: 2,
                a: 1,
            });

            // Test SortDirection.Descending
            expect(data.sortKeys(SortDirection.Descending).all()).toEqual({
                c: 3,
                b: 2,
                a: 1,
            });

            // Test SortDirection.Ascending
            expect(data.sortKeys(SortDirection.Ascending).all()).toEqual({
                a: 1,
                b: 2,
                c: 3,
            });

            // Test with numeric string keys. Integer-like keys are renumbered
            // from 0 by the integer-key policy (see sortedIntoItems), so "1"/"2"/"3"
            // become "0"/"1"/"2" even though the order was already correct.
            const data2 = collect({ "3": "three", "1": "one", "2": "two" });
            expect(data2.sortKeys().all()).toEqual({
                "0": "one",
                "1": "two",
                "2": "three",
            });

            // Test empty collection
            const data3 = collect({});
            expect(data3.sortKeys().all()).toEqual({});

            // Test single item
            const data4 = collect({ a: 1 });
            expect(data4.sortKeys().all()).toEqual({ a: 1 });
        });
    });

    describe("testSortKeysDesc", () => {
        describe("Laravel Tests", () => {
            it("test sort keys desc", () => {
                // CollectionTest::testSortKeysDesc
                const data = collect({ a: "taylor", b: "dayle" });

                expect(data.sortKeysDesc().all()).toEqual({
                    b: "dayle",
                    a: "taylor",
                });
            });
        });
    });

    describe("testSortKeysUsing", () => {
        it("sorts the keys by a comparator answering a bool, as uksort() falls back for one", () => {
            const sorted = collect({ c: 1, a: 2, b: 3 }).sortKeysUsing(
                (a, b) => a > b,
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sort-bool-comparator"
            expect(sorted.all()).toEqual({ a: 2, b: 3, c: 1 });
            expect(sorted.keys().all()).toEqual(["a", "b", "c"]);
            expect(sorted.values().all()).toEqual([2, 3, 1]);
        });

        describe("Laravel Tests", () => {
            it("test sort keys using", () => {
                // CollectionTest::testSortKeysUsing
                const data = collect({ B: "dayle", a: "taylor" });

                expect(data.sortKeysUsing(strnatcasecmp).all()).toEqual({
                    a: "taylor",
                    B: "dayle",
                });
            });
        });

        it("sorts integer keys by the callback, renumbering them over the sorted order", () => {
            const sorted = collect({ 5: "e", 2: "b", 9: "z" }).sortKeysUsing(
                (a, b) => Number(b) - Number(a),
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortKeysUsing-int-keys-desc"
            expect(sorted.values().all()).toEqual(["z", "e", "b"]);
            // JS-only: the sort family renumbers integer keys, where PHP keeps 9, 5 and 2
            expect(sorted.keys().all()).toEqual([0, 1, 2]);
            expect(sorted.all()).toEqual({ 0: "z", 1: "e", 2: "b" });
        });

        it("keeps array backing", () => {
            // JS-only: PHP has no backing to keep; a list stays a list, as it does through sortKeys()
            const sorted = new Collection(["a", "b", "c"]).sortKeysUsing(
                (a, b) => Number(b) - Number(a),
            );
            expect(sorted.all()).toEqual(["c", "b", "a"]);
            expect(Array.isArray(sorted.all())).toBe(true);
        });

        it("casts the comparator's answer to an int, as uksort() does, so a fraction below 1 ties", () => {
            const keyed = collect({ c: 1, a: 2, b: 3 });
            const by = (step: number) => (x: string, y: string) =>
                x < y ? -step : x > y ? step : 0;
            const tied = keyed.sortKeysUsing(by(0.5));
            const sorted = keyed.sortKeysUsing(by(1.5));

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortKeysUsing-fractional-answers"
            expect(tied.all()).toEqual({ c: 1, a: 2, b: 3 });
            expect(tied.keys().all()).toEqual(["c", "a", "b"]);
            expect(tied.values().all()).toEqual([1, 2, 3]);
            expect(sorted.all()).toEqual({ a: 2, b: 3, c: 1 });
            expect(sorted.keys().all()).toEqual(["a", "b", "c"]);
            expect(sorted.values().all()).toEqual([2, 3, 1]);
        });
    });

    describe("sortKeys integer-key policy", () => {
        // docs/php-parity/task-17-second-review.json, "krsort on integer keys":
        // krsort([5=>"e",2=>"b",9=>"z"]) -> {"9":"z","5":"e","2":"b"}; keys get
        // renumbered here (policy), so order is checked via values(), not names.
        it("sorts integer keys descending", () => {
            const sorted = new Collection({
                5: "e",
                2: "b",
                9: "z",
            }).sortKeysDesc();
            expect(sorted.all()).toEqual({ 0: "z", 1: "e", 2: "b" });
            expect(sorted.values().all()).toEqual(["z", "e", "b"]);
        });

        // docs/php-parity/task-17-second-review.json, "ksort on integer keys":
        // ksort([5=>"e",2=>"b",9=>"z"]) -> {"2":"b","5":"e","9":"z"}.
        it("sorts integer keys ascending", () => {
            const sorted = new Collection({
                5: "e",
                2: "b",
                9: "z",
            }).sortKeys();
            expect(sorted.all()).toEqual({ 0: "b", 1: "e", 2: "z" });
            expect(sorted.values().all()).toEqual(["b", "e", "z"]);
        });

        // Generic correctness check, not PHP-parity-sensitive (no probe row
        // covers this): a lexical comparator sorts "10" before "9"; only
        // values() (Object.keys() is forced ascending regardless) can show it.
        it("orders integer keys numerically, not lexically", () => {
            const sorted = new Collection({ 9: "a", 10: "b" }).sortKeysDesc();
            expect(sorted.values().all()).toEqual(["b", "a"]);
        });

        // docs/php-parity/task-17-second-review.json, "krsort on a packed list":
        // krsort([0=>"a",1=>"b",2=>"c"]) -> {"2":"c","1":"b","0":"a"}.
        it("reverses a packed list's keys and keeps it array-backed", () => {
            const sorted = new Collection(["a", "b", "c"]).sortKeysDesc();
            expect(sorted.all()).toEqual(["c", "b", "a"]);
            expect(Array.isArray(sorted.all())).toBe(true);
        });

        // Generic correctness check, not PHP-parity-sensitive (no probe row
        // covers pure string keys); reindexIntegerKeys passes them through.
        it("still sorts string keys", () => {
            const sorted = new Collection({ b: 2, a: 1, c: 3 }).sortKeysDesc();
            expect(sorted.all()).toEqual({ c: 3, b: 2, a: 1 });
            expect(sorted.values().all()).toEqual([3, 2, 1]);
        });

        // docs/php-parity/task-17-second-review.json, "krsort mixes integer and
        // string keys": PHP gives {"b":"bee","10":"j","2":"c"}. Documented
        // limitation: the engine always hoists integer keys first (reindexIntegerKeys).
        it("cannot preserve krsort's order when integer and string keys mix", () => {
            const sorted = new Collection({
                10: "j",
                b: "bee",
                2: "c",
            }).sortKeysDesc();
            expect(sorted.values().all()).toEqual(["j", "c", "bee"]);
        });
    });

    describe("splice", () => {
        it("drops the fraction from an offset before counting a negative one back from the end", () => {
            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-B-splice-fractional-and-non-finite-offsets"
            const list = collect([1, 2, 3, 4]);
            const removed = list.splice(1.5);

            expect(removed.all()).toEqual([2, 3, 4]);
            expect(list.all()).toEqual([1]);
            expect(list.keys().all()).toEqual([0]);
            expect(list.values().all()).toEqual([1]);

            const keyed = collect({ a: 1, b: 2, c: 3, d: 4 });
            const fromTheEnd = keyed.splice(-1.5, 1);

            expect(fromTheEnd.all()).toEqual({ d: 4 });
            expect(fromTheEnd.keys().all()).toEqual(["d"]);
            expect(keyed.all()).toEqual({ a: 1, b: 2, c: 3 });
            expect(keyed.keys().all()).toEqual(["a", "b", "c"]);
            expect(keyed.values().all()).toEqual([1, 2, 3]);

            const keyedOffsetOnly = collect({ a: 1, b: 2, c: 3, d: 4 });

            expect(keyedOffsetOnly.splice(1.5).keys().all()).toEqual([
                "b",
                "c",
                "d",
            ]);
            expect(keyedOffsetOnly.keys().all()).toEqual(["a"]);
            expect(keyedOffsetOnly.values().all()).toEqual([1]);
        });

        it("drops the fraction from a length before counting a negative one back from the end", () => {
            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-B-splice-fractional-and-non-finite-lengths"
            const list = collect([1, 2, 3, 4]);

            expect(list.splice(1, -1.5, ["x"]).all()).toEqual([2, 3]);
            expect(list.all()).toEqual([1, "x", 4]);
            expect(list.keys().all()).toEqual([0, 1, 2]);
            expect(list.values().all()).toEqual([1, "x", 4]);

            const keyed = collect({ a: 1, b: 2, c: 3, d: 4 });

            expect(keyed.splice(1, 1.5, ["x"]).all()).toEqual({ b: 2 });
            expect(keyed.keys().all()).toEqual(["a", 0, "c", "d"]);
            expect(keyed.values().all()).toEqual([1, "x", 3, 4]);
        });

        it("throws array_splice()'s TypeError for an offset or a length no int holds, and splices nothing", () => {
            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-B-splice-fractional-and-non-finite-offsets" and "C32-B-splice-fractional-and-non-finite-lengths"
            for (const value of [NaN, Infinity, -Infinity, 1e19]) {
                const list = collect([1, 2, 3, 4]);
                const keyed = collect({ a: 1, b: 2, c: 3, d: 4 });

                expect(() => list.splice(value, 1)).toThrow(
                    new TypeError(
                        "array_splice(): Argument #2 ($offset) must be of type int, float given",
                    ),
                );
                expect(() => keyed.splice(value)).toThrow(
                    new TypeError(
                        "array_splice(): Argument #2 ($offset) must be of type int, float given",
                    ),
                );
                expect(() => list.splice(1, value, ["x"])).toThrow(
                    new TypeError(
                        "array_splice(): Argument #3 ($length) must be of type ?int, float given",
                    ),
                );
                expect(() => keyed.splice(1, value)).toThrow(
                    new TypeError(
                        "array_splice(): Argument #3 ($length) must be of type ?int, float given",
                    ),
                );
                expect(list.all()).toEqual([1, 2, 3, 4]);
                expect(list.keys().all()).toEqual([0, 1, 2, 3]);
                expect(list.values().all()).toEqual([1, 2, 3, 4]);
                expect(keyed.all()).toEqual({ a: 1, b: 2, c: 3, d: 4 });
                expect(keyed.keys().all()).toEqual(["a", "b", "c", "d"]);
                expect(keyed.values().all()).toEqual([1, 2, 3, 4]);
            }
        });

        it("renumbers negative integer keys on an object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "splice-negative-int-keys"
            const c = collect({ "-1": "a", x: "b", "-5": "c" });

            expect(c.splice(1, 1, ["z"]).all()).toEqual({ x: "b" });
            expect(c.all()).toEqual({ 0: "a", 1: "z", 2: "c" });
        });

        describe("Laravel Tests", () => {
            it("test splice", () => {
                // CollectionTest::testSplice
                const data = collect(["foo", "baz"]);
                data.splice(1);
                expect(data.all()).toEqual(["foo"]);

                const data2 = collect(["foo", "baz"]);
                data2.splice(1, 0, "bar");
                expect(data2.all()).toEqual(["foo", "bar", "baz"]);

                const data3 = collect(["foo", "baz"]);
                data3.splice(1, 1);
                expect(data3.all()).toEqual(["foo"]);

                const data4 = collect(["foo", "baz"]);
                const cut = data4.splice(1, 1, "bar");
                expect(data4.all()).toEqual(["foo", "bar"]);
                expect(cut.all()).toEqual(["baz"]);

                const data5 = collect(["foo", "baz"]);
                data5.splice(1, 0, ["bar"]);
                expect(data5.all()).toEqual(["foo", "bar", "baz"]);

                const data6 = collect(["foo", "baz"]);
                data6.splice(1, 0, collect(["bar"]));
                expect(data6.all()).toEqual(["foo", "bar", "baz"]);
            });
        });

        it("keeps an object-backed collection object-backed after splice", () => {
            // Collection.splice used to assign `this.items = result.value`, and
            // obj.splice's `value` was an array — silently converting an object-backed
            // Collection to array-backed and destroying its keys.
            const collection = new Collection({ a: 1, b: 2, c: 3 });
            const removed = collection.splice(1, 1);
            expect(Array.isArray(collection.all())).toBe(false);
            expect(collection.all()).toEqual({ a: 1, c: 3 });
            expect(removed.all()).toEqual({ b: 2 });
        });

        it("removes to the end for a null length, as array_splice does", () => {
            const collection = collect([1, 2, 3, 4]);
            const returned = collection.splice(1, null, ["x"]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-splice-null-length"
            expect({ returned: returned.all(), all: collection.all() }).toEqual(
                {
                    returned: [2, 3, 4],
                    all: [1, "x"],
                },
            );
            expect(collection.keys().all()).toEqual([0, 1]);
            expect(collection.values().all()).toEqual([1, "x"]);
        });

        it("splices to the end with a single argument, either backing", () => {
            // PHP branches on func_num_args === 1 (Collection.php:1770) — the one-arg
            // form removes offset -> end for both backings, not nothing.
            const fromArray = new Collection(["f", "z"]);
            const fromObject = new Collection({ foo: "f", baz: "z" });
            expect(fromArray.splice(1).all()).toEqual(["z"]);
            expect(fromObject.splice(1).all()).toEqual({ baz: "z" });
        });

        it("splices a keyed collection at the position its items hold, around its string keys", () => {
            const inserted = collect({ a: 1, b: 2 });
            const none = inserted.splice(1, 0, ["p", "q"]);
            const replaced = collect({ a: 1, b: 2, c: 3 });
            const cut = replaced.splice(1, 1, ["p"]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-splice-keyed-order"
            expect(inserted.all()).toEqual({ a: 1, 0: "p", 1: "q", b: 2 });
            expect(inserted.keys().all()).toEqual(["a", 0, 1, "b"]);
            expect(inserted.values().all()).toEqual([1, "p", "q", 2]);
            expect(inserted.first()).toBe(1);
            expect(none.values().all()).toEqual([]);
            expect(replaced.all()).toEqual({ a: 1, 0: "p", c: 3 });
            expect(replaced.keys().all()).toEqual(["a", 0, "c"]);
            expect(replaced.values().all()).toEqual([1, "p", 3]);
            expect(replaced.first()).toBe(1);
            expect(cut.all()).toEqual({ b: 2 });
        });

        it("inserts a Map replacement's values in the order it holds them, on either backing", () => {
            const replacement = () =>
                new Map([
                    [2, "c"],
                    [0, "a"],
                    [1, "b"],
                ]);

            const views = <
                TValue,
                TKey extends PropertyKey,
                TShape extends CollectionShape,
            >(
                collection: Collection<TValue, TKey, TShape>,
            ) => ({
                all: collection.all(),
                keys: collection.keys().all(),
                values: collection.values().all(),
            });
            const list = collect(["x", "y"]);
            const listByCollection = collect(["x", "y"]);
            const keyed = collect({ a: 1, b: 2 });
            const keyedByCollection = collect({ a: 1, b: 2 });

            list.splice(1, 0, replacement());
            listByCollection.splice(1, 0, collect(replacement()));
            keyed.splice(1, 0, replacement());
            keyedByCollection.splice(1, 0, collect(replacement()));

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-splice-replacement-order"
            for (const spliced of [list, listByCollection]) {
                expect(views(spliced)).toEqual({
                    all: ["x", "c", "a", "b", "y"],
                    keys: [0, 1, 2, 3, 4],
                    values: ["x", "c", "a", "b", "y"],
                });
            }

            for (const spliced of [keyed, keyedByCollection]) {
                expect(views(spliced)).toEqual({
                    all: { a: 1, 0: "c", 1: "a", 2: "b", b: 2 },
                    keys: ["a", 0, 1, 2, "b"],
                    values: [1, "c", "a", "b", 2],
                });
            }
        });
    });

    describe("take", () => {
        describe("Laravel Tests", () => {
            it("test take", () => {
                // CollectionTest::testTake
                const data = collect(["taylor", "dayle", "shawn"]);
                expect(data.take(2).all()).toEqual(["taylor", "dayle"]);
            });

            it("test take last", () => {
                // CollectionTest::testTakeLast
                const data = collect(["taylor", "dayle", "shawn"]);
                expect(data.take(-2).all()).toEqual(["dayle", "shawn"]);
            });

            it("test take last with limit greater than collection size", () => {
                // CollectionTest::testTakeLastWithLimitGreaterThanCollectionSize
                // docs/php-parity/task-31-laravel-13-33-sync.json, "take-negative-past-size"
                const data = collect(["taylor", "dayle", "shawn"]);
                expect(data.take(-5).all()).toEqual([
                    "taylor",
                    "dayle",
                    "shawn",
                ]);
            });
        });

        it("takes nothing for a limit of 0", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "collection-take-zero"
            expect(collect(["taylor", "dayle", "shawn"]).take(0).all()).toEqual(
                [],
            );
        });

        it("keeps a record's keys when it takes the last items", () => {
            const taken = collect({ a: 1, b: 2, c: 3 }).take(-2);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-take-assoc-negative"
            expect(viewsOf(taken)).toEqual({
                all: { b: 2, c: 3 },
                keys: ["b", "c"],
                values: [2, 3],
            });
        });

        it("drops a fraction from the limit, taking the last items through slice(limit, abs(limit))", () => {
            const numbers = collect([1, 2, 3, 4, 5, 6]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-take-counts"
            expect(numbers.take(1.5).values().all()).toEqual([1]);
            expect(numbers.take(-1.5).values().all()).toEqual([6]);
        });

        it("throws array_slice's TypeError for a limit that is NAN, infinite or beyond PHP's int range", () => {
            const numbers = collect([1, 2, 3, 4, 5, 6]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-take-counts"
            for (const limit of [NaN, Infinity, 1e19]) {
                expect(() => numbers.take(limit)).toThrowError(TypeError);
                expect(() => numbers.take(limit)).toThrowError(
                    "array_slice(): Argument #3 ($length) must be of type ?int, float given",
                );
            }

            for (const limit of [-Infinity, -1e19]) {
                expect(() => numbers.take(limit)).toThrowError(TypeError);
                expect(() => numbers.take(limit)).toThrowError(
                    "array_slice(): Argument #2 ($offset) must be of type int, float given",
                );
            }
        });
    });

    describe("takeUntil", () => {
        describe("Laravel Tests", () => {
            it("test take until using value", () => {
                // CollectionTest::testTakeUntilUsingValue
                const data = collect([1, 2, 3, 4]);

                expect(data.takeUntil(3).toArray()).toEqual([1, 2]);
            });

            it("test take until using callback", () => {
                // CollectionTest::testTakeUntilUsingCallback
                const data = collect([1, 2, 3, 4]);

                expect(data.takeUntil((item) => item >= 3).toArray()).toEqual([
                    1, 2,
                ]);
            });

            it("test take until returns all items for unmet value", () => {
                // CollectionTest::testTakeUntilReturnsAllItemsForUnmetValue
                const data = collect([1, 2, 3, 4]);

                expect(data.takeUntil(99).toArray()).toEqual(data.toArray());
                expect(data.takeUntil((item) => item >= 99).toArray()).toEqual(
                    data.toArray(),
                );
            });
        });

        it("keeps a keyed collection's keys", () => {
            const taken = collect({ a: 1, b: 2, c: 3 }).takeUntil(3);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-takeUntil-keyed"
            expect(taken.all()).toEqual({ a: 1, b: 2 });
            expect(taken.keys().all()).toEqual(["a", "b"]);
            expect(taken.values().all()).toEqual([1, 2]);
        });

        it("compares the value with PHP's ===", () => {
            const items: (number | string)[] = [1, 2, 3, 4];

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-takeUntil-strict-value"
            expect(collect(items).takeUntil("3").all()).toEqual([1, 2, 3, 4]);
        });

        it("hands a callback each value and key", () => {
            const keyed = collect({ a: 1, b: 2, c: 3 }).takeUntil(
                (_value, key) => key === "c",
            );
            const list = collect(["x", "y", "z"]).takeUntil(
                (_value, key) => key === 1,
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-takeUntil-callback-key"
            expect(keyed.all()).toEqual({ a: 1, b: 2 });
            expect([keyed.keys().all(), keyed.values().all()]).toEqual([
                ["a", "b"],
                [1, 2],
            ]);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-skip-take-callback-index"
            expect(list.all()).toEqual(["x"]);
            expect([list.keys().all(), list.values().all()]).toEqual([
                [0],
                ["x"],
            ]);
        });

        it("takes nothing from an empty collection", () => {
            const none: number[] = [];

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-takeUntil-empty"
            expect(collect(none).takeUntil(1).all()).toEqual([]);
        });

        it.fails("walks a Map-built collection in its insertion order", () => {
            const taken = outOfOrderKeys().takeUntil("a");

            // Ordered-backing gap: PHP walks key 2 first, so taking until a keeps c under key 2
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-skip-take-out-of-order-keys"
            expect([taken.keys().all(), taken.values().all()]).toEqual([
                [2],
                ["c"],
            ]);
        });
    });

    describe("takeWhile", () => {
        describe("Laravel Tests", () => {
            it("test take while using value", () => {
                // CollectionTest::testTakeWhileUsingValue
                const data = collect([1, 1, 2, 2, 3, 3]);

                expect(data.takeWhile(1).toArray()).toEqual([1, 1]);
            });

            it("test take while using callback", () => {
                // CollectionTest::testTakeWhileUsingCallback
                const data = collect([1, 2, 3, 4]);

                expect(data.takeWhile((item) => item < 3).toArray()).toEqual([
                    1, 2,
                ]);
            });

            it("test take while returns no items for unmet value", () => {
                // CollectionTest::testTakeWhileReturnsNoItemsForUnmetValue
                const data = collect([1, 2, 3, 4]);

                expect(data.takeWhile(2).toArray()).toEqual([]);
                expect(data.takeWhile((item) => item === 99).toArray()).toEqual(
                    [],
                );
            });
        });

        it("keeps a keyed collection's keys", () => {
            const taken = collect({ a: 1, b: 1, c: 2, d: 1 }).takeWhile(1);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-takeWhile-keyed"
            expect(taken.all()).toEqual({ a: 1, b: 1 });
            expect(taken.keys().all()).toEqual(["a", "b"]);
            expect(taken.values().all()).toEqual([1, 1]);
        });

        it("compares the value with PHP's ===", () => {
            const items: (number | string)[] = [1, 1, 2];

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-takeWhile-strict-value"
            expect(collect(items).takeWhile("1").all()).toEqual([]);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-takeWhile-null-value"
            expect(collect([null, null, 0]).takeWhile(null).all()).toEqual([
                null,
                null,
            ]);
        });

        it("hands a callback each value and key", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-takeWhile-callback-key"
            expect(
                collect(["x", "y", "z"])
                    .takeWhile((_value, key) => key < 2)
                    .all(),
            ).toEqual(["x", "y"]);
        });

        it.fails("walks a Map-built collection in its insertion order", () => {
            const taken = outOfOrderKeys().takeWhile("c");

            // Ordered-backing gap: PHP walks key 2 first, so taking while c keeps c under key 2
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-skip-take-out-of-order-keys"
            expect([taken.keys().all(), taken.values().all()]).toEqual([
                [2],
                ["c"],
            ]);
        });
    });

    describe("transform", () => {
        describe("Laravel Tests", () => {
            it("test transform", () => {
                // CollectionTest::testTransform
                const data = collect({ first: "taylor", last: "otwell" });
                data.transform((item, key) => `${key}-${strrev(item)}`);
                expect(data.all()).toEqual({
                    first: "first-rolyat",
                    last: "last-llewto",
                });
            });
        });
    });

    describe("dot", () => {
        describe("Laravel Tests", () => {
            it("test dot", () => {
                // CollectionTest::testDot
                const data = Collection.make({
                    name: "Taylor",
                    meta: {
                        foo: "bar",
                        baz: "boom",
                        bam: {
                            boom: "bip",
                        },
                    },
                }).dot();

                expect(data.all()).toEqual({
                    name: "Taylor",
                    "meta.foo": "bar",
                    "meta.baz": "boom",
                    "meta.bam.boom": "bip",
                });

                // In JS, we can't have mixed numeric and string keys in the same array like PHP
                // So we use an object to represent PHP's associative array with mixed keys
                const data2 = Collection.make({
                    foo: {
                        0: "bar",
                        1: "baz",
                        baz: "boom",
                    },
                }).dot();

                expect(data2.all()).toEqual({
                    "foo.0": "bar",
                    "foo.1": "baz",
                    "foo.baz": "boom",
                });

                const data3 = Collection.make({
                    foo: ["bar", "baz", { baz: "boom" }],
                }).dot();

                expect(data3.all()).toEqual({
                    "foo.0": "bar",
                    "foo.1": "baz",
                    "foo.2.baz": "boom",
                });
            });
        });

        it("keeps a list's keys and values in order, which JSON writes as a list", () => {
            const dotted = collect(["a", "b"]).dot();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-dot-list-backing"
            expect(dotted.keys().all()).toEqual([0, 1]);
            expect(dotted.values().all()).toEqual(["a", "b"]);
            expect(dotted.toJson()).toBe('["a","b"]');
            // JS-only: a keyed result keeps its record, where PHP's array with the keys 0 and 1 is a list
            expect(dotted.all()).toEqual({ 0: "a", 1: "b" });
        });

        it("flattens objects inside an array backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "dot-list-of-assoc"
            expect(
                new Collection([{ a: 1 }, { b: { c: 2 } }]).dot().all(),
            ).toEqual({ "0.a": 1, "1.b.c": 2 });
        });

        it("keeps a nested Collection as a leaf on either backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collection-dot-collection-leaf"
            const inner = collect({ a: 1 });
            const list = new Collection([inner]).dot().all();
            const map = new Collection({ c: inner }).dot().all();
            expect(Object.keys(list)).toEqual(["0"]);
            expect(list[0]).toBe(inner);
            expect(Object.keys(map)).toEqual(["c"]);
            expect(map["c"]).toBe(inner);
        });

        describe("Laravel Tests - dotWithDepth", () => {
            it("test dot with depth", () => {
                // CollectionTest::testDotWithDepth
                const data = Collection.make({
                    name: "Taylor",
                    meta: {
                        foo: "bar",
                        bam: {
                            boom: "bip",
                        },
                    },
                }).dot(1);

                expect(data.all()).toEqual({
                    name: "Taylor",
                    "meta.foo": "bar",
                    "meta.bam": {
                        boom: "bip",
                    },
                });
            });
        });

        it.fails(
            "keeps a Map-built collection's keys in the order it holds them",
            () => {
                const dotted = outOfOrderKeys().dot();

                // Ordered-backing gap: PHP keeps the keys in insertion order, 2 before 0 and 1
                // docs/php-parity/task-30-map-order.json, "dot-out-of-order"
                expect(dotted.keys().all()).toEqual([2, 0, 1]);
                expect(dotted.values().all()).toEqual(["c", "a", "b"]);
            },
        );
    });

    describe("undot", () => {
        describe("Laravel Tests", () => {
            it("test undot", () => {
                // CollectionTest::testUndot
                const data = Collection.make({
                    name: "Taylor",
                    "meta.foo": "bar",
                    "meta.baz": "boom",
                    "meta.bam.boom": "bip",
                }).undot();

                expect(data.all()).toEqual({
                    name: "Taylor",
                    meta: {
                        foo: "bar",
                        baz: "boom",
                        bam: {
                            boom: "bip",
                        },
                    },
                });

                const data2 = Collection.make({
                    "foo.0": "bar",
                    "foo.1": "baz",
                    "foo.baz": "boom",
                }).undot();

                expect(data2.all()).toEqual({
                    foo: {
                        0: "bar",
                        1: "baz",
                        baz: "boom",
                    },
                });
            });
        });

        it("keeps the keys 0 and 1 and their values in order, which JSON writes as a list", () => {
            const undotted = collect({ 0: "a", 1: "b" }).undot();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-dot-list-backing"
            expect(undotted.keys().all()).toEqual([0, 1]);
            expect(undotted.values().all()).toEqual(["a", "b"]);
            expect(undotted.toJson()).toBe('["a","b"]');
            // JS-only: a keyed result keeps its record, where PHP's array with the keys 0 and 1 is a list
            expect(undotted.all()).toEqual({ 0: "a", 1: "b" });
        });

        it("rebuilds a list from consecutive integer segments starting at 0, through the object backing", () => {
            // PHP-verified: docs/php-parity/task-09-paths.json, "Arr::undot
            // — integer segments rebuild a list".
            const data = collect({
                "user.languages.0": "PHP",
                "user.languages.1": "C#",
                "user.name": "Taylor",
            }).undot();

            expect(data.all()).toEqual({
                user: { languages: ["PHP", "C#"], name: "Taylor" },
            });
        });

        it.fails(
            "keeps a Map-built collection's keys in the order it holds them",
            () => {
                const undotted = outOfOrderKeys().undot();

                // Ordered-backing gap: PHP keeps the keys in insertion order, 2 before 0 and 1
                // docs/php-parity/task-30-map-order.json, "undot-out-of-order"
                expect(undotted.keys().all()).toEqual([2, 0, 1]);
                expect(undotted.values().all()).toEqual(["c", "a", "b"]);
            },
        );
    });

    describe("unique", () => {
        describe("Laravel Tests", () => {
            it("test unique", () => {
                // CollectionTest::testUnique
                const c = collect(["Hello", "World", "World"]);
                expect(c.unique().all()).toEqual(["Hello", "World"]);

                const c2 = collect([
                    [1, 2],
                    [1, 2],
                    [2, 3],
                    [3, 4],
                    [2, 3],
                ]);
                expect(c2.unique().values().all()).toEqual([
                    [1, 2],
                    [2, 3],
                    [3, 4],
                ]);
            });

            it("test unique with callback", () => {
                // CollectionTest::testUniqueWithCallback
                const c = collect({
                    1: { id: 1, first: "Taylor", last: "Otwell" },
                    2: { id: 2, first: "Taylor", last: "Otwell" },
                    3: { id: 3, first: "Abigail", last: "Otwell" },
                    4: { id: 4, first: "Abigail", last: "Otwell" },
                    5: { id: 5, first: "Taylor", last: "Swift" },
                    6: { id: 6, first: "Taylor", last: "Swift" },
                });

                expect(c.unique("first").all()).toEqual({
                    1: { id: 1, first: "Taylor", last: "Otwell" },
                    3: { id: 3, first: "Abigail", last: "Otwell" },
                });

                expect(
                    c
                        .unique((item) => {
                            return item.first + item.last;
                        })
                        .all(),
                ).toEqual({
                    1: { id: 1, first: "Taylor", last: "Otwell" },
                    3: { id: 3, first: "Abigail", last: "Otwell" },
                    5: { id: 5, first: "Taylor", last: "Swift" },
                });

                expect(
                    c
                        .unique((_item, key) => {
                            return Number(key) % 2;
                        })
                        .all(),
                ).toEqual({
                    1: { id: 1, first: "Taylor", last: "Otwell" },
                    2: { id: 2, first: "Taylor", last: "Otwell" },
                });
            });
        });

        it.each([
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-unique-loose-bool-mix"
                "1, '1', true and 'a'",
                [1, "1", true, "a"],
                [1, "a"],
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-unique-loose-zero-strings"
                "'a', 0, 'b' and '0'",
                ["a", 0, "b", "0"],
                ["a", 0, "b"],
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-unique-loose-falsy"
                "null, 0, '' and false",
                [null, 0, "", false],
                [null],
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-unique-loose-numeric-strings"
                "10, '1e1', 'abc', 'ABC' and '10.0'",
                [10, "1e1", "abc", "ABC", "10.0"],
                [10, "abc", "ABC"],
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-unique-arrays-loose"
                "[1, 2], ['1', 2] and [1, 2]",
                [
                    [1, 2],
                    ["1", 2],
                    [1, 2],
                ],
                [[1, 2]],
            ],
        ] as [string, unknown[], unknown[]][])(
            "keeps the first of each loosely equal value among %s",
            (_label, items, kept) => {
                // The row's keys name the kept items; a list renumbers them, as every removal from a list does
                expect(collect(items).unique().all()).toEqual(kept);
            },
        );

        it("keeps a keyed collection's first key for each value", () => {
            const unique = collect({ a: 1, b: 1, c: 2 }).unique();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-unique-keyed"
            expect(unique.all()).toEqual({ a: 1, c: 2 });
            expect(unique.keys().all()).toEqual(["a", "c"]);
            expect(unique.values().all()).toEqual([1, 2]);
        });

        it("compares a key's values loosely, a dot path's included", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-unique-key-loose", whose keys 0 and
            // 3 name these rows; a list renumbers them, as every removal from a list does
            expect(
                collect([{ id: 1 }, { id: "1" }, { id: true }, { id: 2 }])
                    .unique("id")
                    .all(),
            ).toEqual([{ id: 1 }, { id: 2 }]);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-unique-dot-path", whose keys 0 and 2
            // name these rows
            expect(
                collect([{ a: { b: 1 } }, { a: { b: 1 } }, { a: { b: 2 } }])
                    .unique("a.b")
                    .all(),
            ).toEqual([{ a: { b: 1 } }, { a: { b: 2 } }]);
        });

        it("walks mixed types once, keeping the first of each loosely equal run", () => {
            // JS-only: PHP's == is not transitive, and array_unique's sort then drops '' as well
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-unique-non-transitive-loose"
            expect(collect(["abc", "0", false, ""]).unique().all()).toEqual([
                "abc",
                "0",
                "",
            ]);
        });
    });

    describe("values", () => {
        describe("Laravel Tests", () => {
            it("test values", () => {
                // CollectionTest::testValues
                const c = collect([
                    { id: 1, name: "Hello" },
                    { id: 2, name: "World" },
                ]);
                expect(
                    c
                        .filter((item) => {
                            return item.id === 2;
                        })
                        .values()
                        .all(),
                ).toEqual([{ id: 2, name: "World" }]);
            });

            it("test values reset key", () => {
                // CollectionTest::testValuesResetKey
                const data = collect({ 1: "a", 2: "b", 3: "c" });
                expect(data.values().all()).toEqual(["a", "b", "c"]);
            });
        });

        it("returns collection of values with object keys", () => {
            const collection = collect({ a: 1, b: 2, c: 3 });
            expect(collection.values().all()).toEqual([1, 2, 3]);
        });

        it("returns collection of values with numeric keys", () => {
            const collection = collect([1, 2, 3]);
            expect(collection.values().all()).toEqual([1, 2, 3]);
        });
    });

    describe("zip", () => {
        describe("Laravel Tests", () => {
            it("test zip", () => {
                // CollectionTest::testZip
                const c = collect([1, 2, 3]).zip(collect([4, 5, 6]));
                expect(c).toBeInstanceOf(Collection);
                expect(c.get(0)).toBeInstanceOf(Collection);
                expect(c.get(1)).toBeInstanceOf(Collection);
                expect(c.get(2)).toBeInstanceOf(Collection);
                expect(c.count()).toBe(3);
                expect(c.get(0)!.all()).toEqual([1, 4]);
                expect(c.get(1)!.all()).toEqual([2, 5]);
                expect(c.get(2)!.all()).toEqual([3, 6]);

                const d = collect([1, 2, 3]).zip([4, 5, 6], [7, 8, 9]);
                expect(d.count()).toBe(3);
                expect(d.get(0)!.all()).toEqual([1, 4, 7]);
                expect(d.get(1)!.all()).toEqual([2, 5, 8]);
                expect(d.get(2)!.all()).toEqual([3, 6, 9]);

                const e = collect([1, 2, 3]).zip([4, 5, 6], [7]);
                expect(e.count()).toBe(3);
                expect(e.get(0)!.all()).toEqual([1, 4, 7]);
                expect(e.get(1)!.all()).toEqual([2, 5, null]);
                expect(e.get(2)!.all()).toEqual([3, 6, null]);
            });
        });

        it("handles shorter array in list", () => {
            const c = collect([1, 2, 3]);
            const zipped = c.zip([4, 5]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-zip-operand-shorter"
            expect(zipped.count()).toBe(3);
            expect(zipped.all()[2]?.all()).toEqual([3, null]);
        });

        it("handles arrays of different lengths", () => {
            const c = collect(["a", "b"]);
            const zipped = c.zip([1, 2, 3]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-zip-receiver-shorter"
            expect(zipped.count()).toBe(3);
            expect(zipped.all()[0]?.all()).toEqual(["a", 1]);
            expect(zipped.all()[1]?.all()).toEqual(["b", 2]);
            expect(zipped.all()[2]?.all()).toEqual([null, 3]);
        });

        it("pads an empty receiver with null", () => {
            const zipped = collect([]).zip([1, 2]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-zip-empty-receiver"
            expect(zipped.map((row) => row.all()).all()).toEqual([
                [null, 1],
                [null, 2],
            ]);
        });

        it("pads a record receiver's values with null past its last one", () => {
            const zipped = collect({ a: 1, b: 2 }).zip({
                x: "p",
                y: "q",
                z: "r",
            });

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-zip-assoc-receiver-longer-operand"
            expect(zipped.map((row) => row.all()).all()).toEqual([
                [1, "p"],
                [2, "q"],
                [null, "r"],
            ]);
        });

        it("handles object-based items in zip list", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-zip-assoc-operand"
            const c = collect([1, 2]);
            const zipped = c.zip({ a: "x", b: "y" });
            expect(zipped.count()).toBe(2);
            expect(zipped.all()[0]?.all()).toEqual([1, "x"]);
            expect(zipped.all()[1]?.all()).toEqual([2, "y"]);
        });

        it("pads with null for a null operand", () => {
            const zipped = collect([1, 2]).zip(null);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-zip-null-operand"
            expect(zipped.map((row) => row.all()).all()).toEqual([
                [1, null],
                [2, null],
            ]);
        });

        it.fails(
            "zips a Map-built receiver in the order it holds its keys",
            () => {
                const zipped = outOfOrderKeys().zip(["x", "y", "z"]);

                // Ordered-backing gap: PHP zips the receiver in insertion order, key 2 first
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-receiver-out-of-order"
                expect(zipped.map((row) => row.all()).all()).toEqual([
                    ["c", "x"],
                    ["a", "y"],
                    ["b", "z"],
                ]);
            },
        );

        it.fails(
            "zips a Map-built operand in the order it holds its keys",
            () => {
                const operand = collect(
                    new Map([
                        [2, "c"],
                        [0, "a"],
                    ]),
                );

                // Ordered-backing gap: PHP zips the operand in insertion order, key 2 first
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-operand-out-of-order"
                expect(
                    collect([1, 2])
                        .zip(operand)
                        .map((row) => row.all())
                        .all(),
                ).toEqual([
                    [1, "c"],
                    [2, "a"],
                ]);
            },
        );
    });

    describe("pad", () => {
        it("drops a fraction from the size, as array_pad()'s int parameter does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pad-fractional-and-non-int-sizes"
            const list = collect([1, 2, 3]).pad(7.5, 0);

            expect(list.all()).toEqual([1, 2, 3, 0, 0, 0, 0]);
            expect(list.keys().all()).toEqual([0, 1, 2, 3, 4, 5, 6]);
            expect(list.values().all()).toEqual([1, 2, 3, 0, 0, 0, 0]);

            const keyed = collect({ a: 1, b: 2, c: 3 }).pad(-7.5, 0);

            expect(keyed.all()).toEqual({
                0: 0,
                1: 0,
                2: 0,
                3: 0,
                a: 1,
                b: 2,
                c: 3,
            });
            expect(keyed.keys().all()).toEqual([0, 1, 2, 3, "a", "b", "c"]);
            expect(keyed.values().all()).toEqual([0, 0, 0, 0, 1, 2, 3]);

            const unpadded = collect([1, 2, 3]).pad(0.5, 0);

            expect(unpadded.all()).toEqual([1, 2, 3]);
            expect(unpadded.keys().all()).toEqual([0, 1, 2]);
            expect(unpadded.values().all()).toEqual([1, 2, 3]);
        });

        it("pads a fractional size in the order PHP's array holds integer keys out of order", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pad-fractional-size-out-of-order-keys"
            const outOfOrder = () =>
                collect(
                    new Map([
                        [2, "c"],
                        [0, "a"],
                        [1, "b"],
                    ]),
                );
            const after = outOfOrder().pad(4.5, "P");
            const before = outOfOrder().pad(-4.5, "P");

            // JS-only: a keyed backing keeps its record, whose keys here run 0..3 as PHP's list's do
            expect(after.all()).toEqual({ 0: "c", 1: "a", 2: "b", 3: "P" });
            expect(after.keys().all()).toEqual([0, 1, 2, 3]);
            expect(after.values().all()).toEqual(["c", "a", "b", "P"]);
            expect(before.all()).toEqual({ 0: "P", 1: "c", 2: "a", 3: "b" });
            expect(before.keys().all()).toEqual([0, 1, 2, 3]);
            expect(before.values().all()).toEqual(["P", "c", "a", "b"]);
            expect(() => outOfOrder().pad(NaN, "P")).toThrow(
                new TypeError(
                    "array_pad(): Argument #2 ($length) must be of type int, float given",
                ),
            );
        });

        it("throws array_pad()'s TypeError for a size no int holds, and its ValueError past the maximum array size", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pad-fractional-and-non-int-sizes"
            for (const size of [NaN, Infinity, -Infinity, 1e19, -1e19]) {
                expect(() => collect([1, 2, 3]).pad(size, 0)).toThrow(
                    new TypeError(
                        "array_pad(): Argument #2 ($length) must be of type int, float given",
                    ),
                );
                expect(() =>
                    collect({ a: 1, b: 2, c: 3 }).pad(size, 0),
                ).toThrow(
                    new TypeError(
                        "array_pad(): Argument #2 ($length) must be of type int, float given",
                    ),
                );
            }

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pad-far-past-maximum-array-size"
            for (const size of [1e18, -1e18]) {
                expect(() => collect([1, 2, 3]).pad(size, 0)).toThrow(
                    new Error(
                        "array_pad(): Argument #2 ($length) must not exceed the maximum allowed array size",
                    ),
                );
            }
        });

        it("renumbers a negative integer key on an object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "pad-negative-int-key"
            expect(collect({ "-1": "a", x: "b" }).pad(-4, 0).all()).toEqual({
                0: 0,
                1: 0,
                2: "a",
                x: "b",
            });
        });

        describe("Laravel Tests", () => {
            it("test pad", () => {
                // CollectionTest::testPadPadsArrayWithValue
                let c = collect([1, 2, 3]);
                c = c.pad(4, 0);
                expect(c.all()).toEqual([1, 2, 3, 0]);

                let d = collect([1, 2, 3, 4, 5]);
                d = d.pad(4, 0);
                expect(d.all()).toEqual([1, 2, 3, 4, 5]);

                let e = collect([1, 2, 3]);
                e = e.pad(-4, 0);
                expect(e.all()).toEqual([0, 1, 2, 3]);

                let f = collect([1, 2, 3, 4, 5]);
                f = f.pad(-4, 0);
                expect(f.all()).toEqual([1, 2, 3, 4, 5]);
            });
        });

        it.fails("keeps its padding after a string key", () => {
            const collection = collect({ 5: "a", x: "b" }).pad(4, 0);

            // Ordered-backing gap: PHP appends the padding after the string key, so x comes before 1 and 2
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pad-past-a-string-key-order"
            expect({
                keys: collection.keys().all(),
                values: collection.values().all(),
            }).toEqual({ keys: [0, "x", 1, 2], values: ["a", "b", 0, 0] });
        });

        it("numbers negative pad slots from zero for object-backed collections", () => {
            // PHP-verified: array_pad(["a"=>1,"b"=>2], -5, 0) ->
            // {"0":0,"1":0,"2":0,"a":1,"b":2} (docs/php-parity/task-07-pad-union.json).
            const c = collect({ a: 1, b: 2 });
            expect(c.pad(-5, 0).all()).toEqual({
                0: 0,
                1: 0,
                2: 0,
                a: 1,
                b: 2,
            });
        });

        it("returns a copy even when no padding is needed for object-backed collections", () => {
            // JS-only: PHP's array_pad hands back a value, so only a JS backing could be shared
            const items = { a: 1, b: 2 };
            const c = collect(items);
            expect(c.pad(2, 0).all()).not.toBe(items);
        });
    });

    describe("getIterator", () => {
        describe("Laravel Tests", () => {
            it("test iterable", () => {
                // CollectionTest::testIterable
                const c = collect(["foo"]);
                const iterator = c.getIterator();
                expect(iterator[Symbol.iterator]).toBeDefined();

                const items: string[] = [];
                for (const item of iterator) {
                    items.push(item);
                }
                expect(items).toEqual(["foo"]);
            });
        });

        it("iterates over object collection values", () => {
            const c = collect({ a: 1, b: 2, c: 3 });
            const iterator = c.getIterator();

            const items: number[] = [];
            for (const item of iterator) {
                items.push(item);
            }
            expect(items).toEqual([1, 2, 3]);
        });

        it("iterates a snapshot, as PHP's ArrayIterator iterates a copy of the items", () => {
            const collection = collect([1, 2]);
            const seen: number[] = [];

            for (const value of collection.getIterator()) {
                seen.push(value);

                if (seen.length < 5) {
                    collection.push(9);
                }
            }

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-iterator-is-a-snapshot"
            expect([seen, collection.all()]).toEqual([
                [1, 2],
                [1, 2, 9, 9],
            ]);
        });

        it("skips a list's holes, which hold no item", () => {
            const holes: string[] = [];
            holes[1] = "b";

            // JS-only: PHP has no sparse array; a hole holds no item, as count() says
            expect([...new Collection(holes).getIterator()]).toEqual(["b"]);
        });
    });

    describe("count", () => {
        describe("Laravel Tests", () => {
            it("test countable", () => {
                // CollectionTest::testCountable
                // JS-only: Number(c) and length stand in for PHP's Countable
                const c = collect(["foo", "bar"]);
                expect(Number(c)).toBe(2);
                expect(c).toHaveLength(2);
            });
        });

        it("returns number of array items", () => {
            const collection = collect([1, 2, 3]);
            expect(collection.count()).toBe(3);
        });

        it("returns number of object items", () => {
            const collection = collect({ a: 1, b: 2, c: 3 });
            expect(collection.count()).toBe(3);
        });

        it("returns 0 for empty array collection", () => {
            const collection = collect([]);
            expect(collection.count()).toBe(0);
        });

        it("returns 0 for empty object collection", () => {
            const collection = collect({});
            expect(collection.count()).toBe(0);
        });
    });

    describe("Symbol.toPrimitive", () => {
        it("concatenates as its JSON, as PHP's string conversion does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-string-concat-is-json"
            expect(collect(["foo"]) + "").toBe('["foo"]');
            expect(`${collect(["foo"])}`).toBe('["foo"]');
        });

        it("reads as its count where a number is wanted", () => {
            const collection = collect([1, 2, 3]);

            // JS-only: PHP cannot cast a Collection to a number, but +c and Number(c) read the count here
            expect(+collection).toBe(3);
            expect(Number(collection)).toBe(3);
        });
    });

    describe("countBy", () => {
        describe("Laravel Tests", () => {
            it("test count by standalone", () => {
                // CollectionTest::testCountByStandalone
                const c = collect([
                    "foo",
                    "foo",
                    "foo",
                    "bar",
                    "bar",
                    "foobar",
                ]);
                expect(c.countBy().all()).toEqual({
                    foo: 3,
                    bar: 2,
                    foobar: 1,
                });
                expect(c.countBy().keys().all()).toEqual([
                    "foo",
                    "bar",
                    "foobar",
                ]);
                expect(c.countBy().values().all()).toEqual([3, 2, 1]);

                const d = collect([true, true, false, false, false]);
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-countBy-bools"
                expect(d.countBy().all()).toEqual({ 1: 2, 0: 3 });
                expect(d.countBy().keys().all()).toEqual([1, 0]);
                expect(d.countBy().values().all()).toEqual([2, 3]);

                const e = collect([1, 5, 1, 5, 5, 1]);
                expect(e.countBy().all()).toEqual({ 1: 3, 5: 3 });
                expect(e.countBy().keys().all()).toEqual([1, 5]);
                expect(e.countBy().values().all()).toEqual([3, 3]);

                const f = collect([
                    StaffEnum.from("James"),
                    StaffEnum.from("Joe"),
                    StaffEnum.from("Taylor"),
                ]);
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-countBy-pure-enum"
                expect(f.countBy().all()).toEqual({
                    James: 1,
                    Joe: 1,
                    Taylor: 1,
                });
                expect(f.countBy().keys().all()).toEqual([
                    "James",
                    "Joe",
                    "Taylor",
                ]);
                expect(f.countBy().values().all()).toEqual([1, 1, 1]);
            });

            it("test count by with key", () => {
                // CollectionTest::testCountByWithKey
                const c = collect([
                    { key: "a" },
                    { key: "a" },
                    { key: "a" },
                    { key: "a" },
                    { key: "b" },
                    { key: "b" },
                    { key: "b" },
                ]);
                expect(c.countBy("key").all()).toEqual({ a: 4, b: 3 });
                expect(c.countBy("key").keys().all()).toEqual(["a", "b"]);
                expect(c.countBy("key").values().all()).toEqual([4, 3]);

                const d = collect([
                    { key: TestBackedEnum.from(1) },
                    { key: TestBackedEnum.from(2) },
                    { key: TestBackedEnum.from(2) },
                ]);
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-countBy-key-backed-enum"
                expect(d.countBy("key").all()).toEqual({ 1: 1, 2: 2 });
                expect(d.countBy("key").keys().all()).toEqual([1, 2]);
                expect(d.countBy("key").values().all()).toEqual([1, 2]);
            });

            it("test count by with callback", () => {
                // CollectionTest::testCountableByWithCallback
                const c = collect(["alice", "aaron", "bob", "carla"]);
                expect(c.countBy((name) => name.charAt(0)).all()).toEqual({
                    a: 2,
                    b: 1,
                    c: 1,
                });

                const d = collect([1, 2, 3, 4, 5]);
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-countBy-callback-bool"
                expect(d.countBy((i) => i % 2 === 0).all()).toEqual({
                    1: 2,
                    0: 3,
                });

                const e = collect(["A", "A", "B", "A"] as const);
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-countBy-callback-string-enum"
                expect(
                    e.countBy((i) => TestStringBackedEnum.from(i)).all(),
                ).toEqual({ A: 3, B: 1 });
            });
        });

        it("throws for a plain object result, which PHP cannot count under", () => {
            const c = collect([{ type: "a" }, { type: "b" }, { type: "a" }]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-countBy-assoc-key"
            expect(() => c.countBy((item) => ({ t: item.type }))).toThrow(
                new TypeError(
                    "Cannot access offset of type array in isset or empty",
                ),
            );
        });

        it("throws for an array result, which PHP cannot count under", () => {
            const c = collect([
                [1, 2],
                [1, 2],
                [3, 4],
            ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-countBy-array-key"
            expect(() => c.countBy((item) => item)).toThrow(
                new TypeError(
                    "Cannot access offset of type array in isset or empty",
                ),
            );
        });

        it("counts null and undefined keys under an empty string key", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-countBy-null-key"
            const c = collect([{ url: null }, { url: "a" }, {}]);
            expect(c.countBy("url").all()).toEqual({
                "": 2,
                a: 1,
            });
        });
    });

    describe("add", () => {
        describe("Laravel Tests", () => {
            it("test add", () => {
                // CollectionTest::testAdd
                const c = collect([]);
                c.add(1);
                expect(c.values().all()).toEqual([1]);
                c.add(2);
                expect(c.values().all()).toEqual([1, 2]);
                c.add("");
                expect(c.values().all()).toEqual([1, 2, ""]);
                c.add(null);
                expect(c.values().all()).toEqual([1, 2, "", null]);
                c.add(false);
                expect(c.values().all()).toEqual([1, 2, "", null, false]);
                c.add([]);
                expect(c.values().all()).toEqual([1, 2, "", null, false, []]);
                c.add("name");
                expect(c.values().all()).toEqual([
                    1,
                    2,
                    "",
                    null,
                    false,
                    [],
                    "name",
                ]);
                c.put(0, 3);

                // docs/php-parity/task-26-collection-order.json, "order-put-existing-key"
                expect(c.values().all()).toEqual([
                    3,
                    2,
                    "",
                    null,
                    false,
                    [],
                    "name",
                ]);
            });
        });

        it("appends at 0 onto a backing whose keys are all strings", () => {
            const c = collect({
                a: 5,
                b: 2,
                c: "",
                d: null,
                e: false,
                f: [],
                g: "name",
            });
            c.add("home");

            // docs/php-parity/task-26-collection-order.json,
            // "append-key-with-no-integer-key-is-zero": no integer key means the append lands on 0, and last,
            // whatever else the backing holds — here seven string keys instead of the row's one.
            expect(c.all()).toEqual({
                a: 5,
                b: 2,
                c: "",
                d: null,
                e: false,
                f: [],
                g: "name",
                0: "home",
            });
            expect(c.keys().all()).toEqual([
                "a",
                "b",
                "c",
                "d",
                "e",
                "f",
                "g",
                0,
            ]);
            expect(c.values().all()).toEqual([
                5,
                2,
                "",
                null,
                false,
                [],
                "name",
                "home",
            ]);
        });
    });

    describe("toBase", () => {
        it("returns a base Collection holding a subclass's items", () => {
            class Sub extends Collection<number, number> {}

            const base = Sub.make([1, 2]).toBase();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-toBase-is-base-class"
            expect([base.constructor, base.all()]).toEqual([
                Collection,
                [1, 2],
            ]);
        });

        it("copies the items rather than sharing them", () => {
            class Sub extends Collection<number, number> {}

            const sub = Sub.make([1, 2]);
            const base = sub.toBase();
            base.push(3);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-toBase-copies"
            expect([sub.all(), base.all()]).toEqual([
                [1, 2],
                [1, 2, 3],
            ]);
        });
    });

    describe("offsetExists", () => {
        describe("Laravel Tests", () => {
            it("test offsetExists", () => {
                // CollectionTest::testArrayAccessOffsetExists
                const c = collect({ a: "foo", b: "bar", c: null });
                expect(c.offsetExists("a")).toBe(true);
                expect(c.offsetExists("b")).toBe(true);
                expect(c.offsetExists("c")).toBe(false);

                const d = collect(["foo", "bar", null]);
                expect(d.offsetExists(0)).toBe(true);
                expect(d.offsetExists(1)).toBe(true);
                expect(d.offsetExists(2)).toBe(false);
            });

            it("test behaves like an array with array access", () => {
                // CollectionTest::testBehavesLikeAnArrayWithArrayAccess
                const list = new Collection(["foo", null]);
                expect(list.offsetExists(0)).toBe(true);
                expect(list.offsetExists(1)).toBe(false);
                expect(list.offsetExists(1000)).toBe(false);
                expect(list.offsetGet(0)).toBe("foo");
                expect(list.offsetGet(1)).toBeNull();

                const record = new Collection({ k1: "foo", k2: null });
                expect(record.offsetExists("k1")).toBe(true);
                expect(record.offsetExists("k2")).toBe(false);
                expect(record.offsetExists("k3")).toBe(false);
                expect(record.offsetGet("k1")).toBe("foo");
                expect(record.offsetGet("k2")).toBeNull();
            });
        });

        it("answers true for every falsy value that is not null, as isset does", () => {
            const collection = collect([0, false, "", [], "0"]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-offsetExists-falsy-values"
            expect(
                [0, 1, 2, 3, 4].map((key) => collection.offsetExists(key)),
            ).toEqual([true, true, true, true, true]);
        });

        it("answers true for a zero value on a record", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-offsetExists-zero-on-record"
            expect(collect({ a: 0 }).offsetExists("a")).toBe(true);
        });

        it("answers false for a member a plain object or an array inherits", () => {
            // JS-only: PHP's array inherits no members, so only an own key can be set.
            expect(collect({ a: 1 }).offsetExists("toString")).toBe(false);
            expect(collect([1, 2]).offsetExists("length")).toBe(false);
        });
    });

    describe("offsetGet", () => {
        describe("Laravel Tests", () => {
            it("test offset get", () => {
                // CollectionTest::testArrayAccessOffsetGet
                const c = collect({ a: "foo", b: "bar" });
                expect(c.offsetGet("a")).toBe("foo");
                expect(c.offsetGet("b")).toBe("bar");

                const d = collect(["foo", "bar"]);
                expect(d.offsetGet(0)).toBe("foo");
                expect(d.offsetGet(1)).toBe("bar");
            });

            it("test offset access", () => {
                // CollectionTest::testOffsetAccess
                const c = new Collection({ name: "taylor" });
                expect(c.offsetGet("name")).toBe("taylor");
                c.offsetSet("name", "dayle");
                expect(c.offsetGet("name")).toBe("dayle");
                expect(c.offsetExists("name")).toBe(true);
                c.offsetUnset("name");
                expect(c.offsetExists("name")).toBe(false);
                c.offsetSet(null, "jason");
                expect(c.offsetGet(0)).toBe("jason");
            });
        });

        it("misses a member a plain object inherits", () => {
            const record = collect({ a: 1 });

            // JS-only: a miss is undefined (PHP: null, with a warning)
            expect(record.offsetGet("toString")).toBeUndefined();
            expect(record.offsetGet("constructor")).toBeUndefined();
            expect(record.offsetGet("__proto__")).toBeUndefined();
        });

        it("reads an own __proto__ key as the item it holds", () => {
            const record = collect(Object.fromEntries([["__proto__", 5]]));

            // docs/php-parity/task-16-final-review.json,
            // '"__proto__" is an ordinary array key in every keyed Collection result'
            expect(record.offsetGet("__proto__")).toBe(5);
        });

        it("misses a list's length and its methods", () => {
            const list = collect([1, 2]);

            // JS-only: a miss is undefined (PHP: null, with a warning)
            expect(list.offsetGet("length")).toBeUndefined();
            expect(list.offsetGet("map")).toBeUndefined();
        });

        it("misses exactly where get() falls back to its default", () => {
            const sentinel = Symbol("default");
            const recordKeys = [
                "toString",
                "constructor",
                "__proto__",
                "a",
                "b",
            ];
            const listKeys = ["length", "map", 0, 2];
            const record = collect({ a: 1 });
            const list = collect([1, 2]);

            // JS-only: a miss is undefined (PHP: null, with a warning)
            expect(
                recordKeys.map((key) => record.offsetGet(key) === undefined),
            ).toEqual([true, true, true, false, true]);
            expect(
                recordKeys.map((key) => record.get(key, sentinel) === sentinel),
            ).toEqual([true, true, true, false, true]);
            expect(
                listKeys.map((key) => list.offsetGet(key) === undefined),
            ).toEqual([true, true, false, true]);
            expect(
                listKeys.map((key) => list.get(key, sentinel) === sentinel),
            ).toEqual([true, true, false, true]);
        });
    });

    describe("offsetSet", () => {
        describe("Laravel Tests", () => {
            it("test offsetSet", () => {
                // CollectionTest::testArrayAccessOffsetSet
                const d = collect(["foo", "foo"]);

                d.offsetSet(1, "bar");
                expect(d.offsetGet(1)).toBe("bar");

                d.offsetSet(null, "qux");
                expect(d.offsetGet(2)).toBe("qux");

                const c = collect({ a: "foo", b: "foo" });

                c.offsetSet("b", "bar");
                expect(c.get("b")).toBe("bar");

                c.offsetSet(null, "qux");

                // docs/php-parity/task-26-collection-order.json,
                // "append-key-with-no-integer-key-is-zero": unlike the list above, this backing has no
                // integer key, so the append lands on 0 — never on the count, 2.
                expect(c.get(0)).toBe("qux");
            });
        });
    });

    describe("offsetUnset", () => {
        describe("Laravel Tests", () => {
            it("test offsetUnset", () => {
                // CollectionTest::testArrayAccessOffsetUnset
                const c = collect({ a: "foo", b: "bar" });
                c.offsetUnset("b");
                expect(c.offsetExists("b")).toBe(false);

                const d = collect(["foo", "bar"]);
                d.offsetUnset(1);
                expect(d.offsetExists(1)).toBe(false);
            });
        });

        it("leaves a list untouched for a negative key", () => {
            const collection = collect(["a", "b", "c"]);
            collection.offsetUnset(-1);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-offsetUnset-negative-on-list"
            expect(collection.all()).toEqual(["a", "b", "c"]);
            expect(collection.keys().all()).toEqual([0, 1, 2]);
            expect(collection.values().all()).toEqual(["a", "b", "c"]);
        });

        it("leaves a list untouched for a string key", () => {
            const collection = collect(["a", "b", "c"]);
            collection.offsetUnset("x");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-offsetUnset-string-on-list"
            expect(collection.all()).toEqual(["a", "b", "c"]);
            expect(collection.keys().all()).toEqual([0, 1, 2]);
            expect(collection.values().all()).toEqual(["a", "b", "c"]);
        });
    });

    describe("make", () => {
        describe("Laravel Tests", () => {
            it("test make method", () => {
                // CollectionTest::testMakeMethod
                const data = Collection.make("foo");
                expect(data.all()).toEqual(["foo"]);
            });

            it("test make method from null", () => {
                // CollectionTest::testMakeMethodFromNull
                const data = Collection.make(null);
                expect(data.all()).toEqual([]);

                const data2 = Collection.make();
                expect(data2.all()).toEqual([]);
            });

            it("test make method from collection", () => {
                // CollectionTest::testMakeMethodFromCollection
                const firstCollection = Collection.make({ foo: "bar" });
                const secondCollection = Collection.make(firstCollection);
                expect(secondCollection.all()).toEqual({ foo: "bar" });
            });

            it("test make method from array", () => {
                // CollectionTest::testMakeMethodFromArray
                // CollectionTest::testConstructMakeFromObject
                const data = Collection.make({ foo: "bar" });
                expect(data.all()).toEqual({ foo: "bar" });

                const data2 = Collection.make(["foo", "bar"]);
                expect(data2.all()).toEqual(["foo", "bar"]);
            });
        });

        it("copies a collection's items rather than sharing them", () => {
            const a = collect([1]);
            const b = Collection.make(a);
            b.push(2);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-make-collection-copies"
            expect([a.all(), b.all()]).toEqual([[1], [1, 2]]);
        });
    });

    describe("wrap", () => {
        describe("Laravel Tests", () => {
            it("test wrap with scalar", () => {
                // CollectionTest::testWrapWithScalar
                const data = Collection.wrap("foo");
                expect(data.all()).toEqual(["foo"]);
            });

            it("test wrap with array", () => {
                // CollectionTest::testWrapWithArray
                const data = Collection.wrap(["foo"]);
                expect(data.all()).toEqual(["foo"]);
            });

            it("test wrap with arrayable", () => {
                // CollectionTest::testWrapWithArrayable
                class TestArrayableObject {
                    toArray() {
                        return ["arrayable"];
                    }
                }

                const obj = new TestArrayableObject();
                const data = Collection.wrap(obj);
                expect(data.all()).toEqual([obj]);
            });

            it("test wrap with jsonable", () => {
                // CollectionTest::testWrapWithJsonable
                class TestJsonableObject {
                    toJSON() {
                        return JSON.stringify(["jsonable"]);
                    }
                }

                const obj = new TestJsonableObject();
                const data = Collection.wrap(obj);
                expect(data.all()).toEqual([obj]);
            });

            it("test wrap with json serialize", () => {
                // CollectionTest::testWrapWithJsonSerialize
                class TestJsonSerializeObject {
                    toJSON() {
                        return JSON.stringify(["jsonserialize"]);
                    }
                }

                const obj = new TestJsonSerializeObject();
                const data = Collection.wrap(obj);
                expect(data.all()).toEqual([obj]);
            });

            it("test wrap with collection class", () => {
                // CollectionTest::testWrapWithCollectionClass
                const innerCollection = Collection.make(["foo"]);
                const data = Collection.wrap(innerCollection);
                expect(data.all()).toEqual(["foo"]);
            });

            it("test wrap with collection sub class", () => {
                // CollectionTest::testWrapWithCollectionSubclass
                class TestCollectionSubclass extends Collection<
                    unknown,
                    string
                > {}

                const innerCollection = Collection.make(["foo"]);
                const data = TestCollectionSubclass.wrap(innerCollection);
                expect(data.all()).toEqual(["foo"]);
                expect(data).toBeInstanceOf(TestCollectionSubclass);
            });
        });

        it("copies a collection's items into a new instance", () => {
            const a = collect([1]);
            const b = Collection.wrap(a);
            b.push(2);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-wrap-collection-copies"
            expect([a.all(), b.all(), a === b]).toEqual([[1], [1, 2], false]);
        });

        it("takes a plain object's entries as the items, as PHP takes an array's", () => {
            const collection = Collection.wrap({ a: 1 });

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-wrap-assoc-array"
            expect(collection.all()).toEqual({ a: 1 });
            expect(collection.keys().all()).toEqual(["a"]);
            expect(collection.values().all()).toEqual([1]);
        });

        it("takes a Map's entries as the items, as the constructor does", () => {
            const collection = Collection.wrap(new Map([["a", 1]]));

            // JS-only: a Map stands in for a keyed PHP array, which wrap() hands to the constructor as it is
            expect(collection.all()).toEqual({ a: 1 });
            expect(collection.keys().all()).toEqual(["a"]);
            expect(collection.values().all()).toEqual([1]);
        });

        it("builds an empty collection from null or undefined", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-wrap-null"
            expect(Collection.wrap(null).all()).toEqual([]);

            // JS-only: undefined is read as PHP's null
            expect(Collection.wrap(undefined).all()).toEqual([]);
        });

        it("wraps false, which is no array", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-wrap-false"
            expect(Collection.wrap(false).all()).toEqual([false]);
        });
    });

    describe("unwrap", () => {
        describe("Laravel Tests", () => {
            it("test unwrap collection", () => {
                // CollectionTest::testUnwrapCollection
                const data = new Collection(["foo"]);
                expect(Collection.unwrap(data)).toEqual(["foo"]);
            });

            it("test unwrap collection with array", () => {
                // CollectionTest::testUnwrapCollectionWithArray
                expect(Collection.unwrap(["foo"])).toEqual(["foo"]);
            });

            it("test unwrap collection with scalar", () => {
                // CollectionTest::testUnwrapCollectionWithScalar
                expect(Collection.unwrap("foo")).toBe("foo");
            });
        });
    });

    describe("empty", () => {
        describe("Laravel Tests", () => {
            it("test empty method", () => {
                // CollectionTest::testEmptyMethod
                const c = Collection.empty();
                expect(c.count()).toBe(0);
                expect(c.all()).toEqual([]);
            });

            it("test empty collection is empty", () => {
                // CollectionTest::testEmptyCollectionIsEmpty
                const c = new Collection();
                expect(c.isEmpty()).toBe(true);
            });

            it("test empty collection is not empty", () => {
                // CollectionTest::testEmptyCollectionIsNotEmpty
                const c = new Collection(["foo", "bar"]);
                expect(c.isEmpty()).toBe(false);
                expect(c.isNotEmpty()).toBe(true);
            });
        });

        it("builds an empty list even when handed false", () => {
            const collection = Reflect.apply(Collection.empty, Collection, [
                false,
            ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-empty-extra-argument-is-ignored"
            expect(collection.all()).toEqual([]);
        });
    });

    describe("times", () => {
        it("throws range()'s ValueError for a count past the maximum array size before it builds an item", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-times-past-maximum-array-size"
            expect(() => Collection.times(1e19)).toThrow(
                new Error(
                    "The supplied range exceeds the maximum array size by 9999999998926258176.0 elements: start=1.0, end=10000000000000000000.0, step=1.0. Max size: 1073741824",
                ),
            );
        });

        describe("Laravel Tests", () => {
            it("test times method", () => {
                // CollectionTest::testTimesMethod
                const two = Collection.times(2, (number) => {
                    return `slug-${number}`;
                });
                expect(two.all()).toEqual(["slug-1", "slug-2"]);

                const zero = Collection.times(0, (number) => {
                    return `slug-${number}`;
                });
                expect(zero.isEmpty()).toBe(true);

                const negative = Collection.times(-4, (number) => {
                    return `slug-${number}`;
                });
                expect(negative.isEmpty()).toBe(true);

                const range = Collection.times(5);
                expect(range.all()).toEqual([1, 2, 3, 4, 5]);
            });
        });

        it("throws range()'s error for a count that is not finite, and builds nothing below one", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-times-non-finite-count"
            expect(() => Collection.times(NaN)).toThrow(
                new Error(
                    "range(): Argument #2 ($end) must be a finite number, NAN provided",
                ),
            );
            expect(() => Collection.times(Infinity)).toThrow(
                new Error(
                    "range(): Argument #2 ($end) must be a finite number, INF provided",
                ),
            );
            expect(Collection.times(-Infinity).all()).toEqual([]);
        });

        it("counts to the whole part of a fractional count", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-times-fractional-count"
            expect(Collection.times(2.7).all()).toEqual([1, 2]);
        });
    });

    describe("fromJson", () => {
        describe("Laravel Tests", () => {
            it("test from json", () => {
                // CollectionTest::testFromJson
                const json = JSON.stringify({ foo: "bar", baz: "quz" });

                const instance = Collection.fromJson(json);

                expect(instance.all()).toEqual({ foo: "bar", baz: "quz" });
            });
        });

        it("builds an empty collection from invalid JSON, as json_decode gives null", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-fromJson-invalid-is-empty"
            expect(Collection.fromJson("{bad").all()).toEqual([]);
        });

        it("wraps a decoded scalar and builds nothing from JSON null", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-fromJson-scalar-is-wrapped"
            expect(Collection.fromJson("5").all()).toEqual([5]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-fromJson-null-is-empty"
            expect(Collection.fromJson("null").all()).toEqual([]);
        });

        it("decodes a JSON array as a list", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-fromJson-list"
            expect(Collection.fromJson('["a","b"]').all()).toEqual(["a", "b"]);
        });

        it.fails(
            "keeps a decoded object's integer keys in their order in the JSON",
            () => {
                const collection = Collection.fromJson('{"2":"a","1":"b"}');

                // Ordered-backing gap: PHP's json_decode keeps the keys in document order, 2 before 1
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-fromJson-integer-keys-out-of-order"
                expect(collection.keys().all()).toEqual([2, 1]);
            },
        );
    });

    describe("avg", () => {
        describe("Laravel Tests", () => {
            it("test getting avg items from collection", () => {
                // CollectionTest::testGettingAvgItemsFromCollection, but for its ->avg->foo proxies, not ported
                const c = collect([{ foo: 10 }, { foo: 20 }]);
                expect(
                    c.avg((item) => {
                        return item.foo;
                    }),
                ).toBe(15);
                expect(c.avg("foo")).toBe(15);
                expect(
                    c.avg((item) => {
                        return item.foo;
                    }),
                ).toBe(15);

                const d = collect([{ foo: 10 }, { foo: 20 }, { foo: null }]);
                expect(
                    d.avg((item) => {
                        return item.foo;
                    }),
                ).toBe(15);
                expect(d.avg("foo")).toBe(15);
                expect(
                    d.avg((item) => {
                        return item.foo;
                    }),
                ).toBe(15);

                const e = collect([{ foo: 10 }, { foo: 20 }]);
                expect(e.avg("foo")).toBe(15);
                expect(
                    e.avg((item) => {
                        return item.foo;
                    }),
                ).toBe(15);

                const f = collect([1, 2, 3, 4, 5]);
                expect(f.avg()).toBe(3);

                const g = collect();
                expect(g.avg()).toBeNull();

                const h = collect([{ foo: "4" }, { foo: "2" }]);
                expect(typeof h.avg("foo")).toBe("number");
                expect(h.avg("foo")).toBe(3);

                const i = collect([{ foo: 1 }, { foo: 2 }]);
                expect(typeof i.avg("foo")).toBe("number");
                expect(i.avg("foo")).toBe(1.5);

                const j = collect([{ foo: 1 }, { foo: 2 }, { foo: 6 }]);
                expect(j.avg("foo")).toBe(3);

                const k = collect([0]);
                expect(k.avg()).toBe(0);
            });
        });

        it("throws PHP's TypeError for a non-numeric string", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-avg-non-numeric-string"
            expect(() => collect([10, "house", 20]).avg()).toThrow(
                new TypeError("Unsupported operand types: int + string"),
            );
            expect(() =>
                collect([
                    { foo: 10 },
                    { foo: "not a number" },
                    { foo: 20 },
                ]).avg("foo"),
            ).toThrow(new TypeError("Unsupported operand types: int + string"));
        });

        it("hands the callback the key as well as the value", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-avg-callback-arity" counts PHP's one
            // JS-only: the key is an extra argument, which never changes what a callback PHP accepts answers
            expect(collect({ a: 1 }).avg((...args) => args.length)).toBe(2);
        });
    });

    describe("average", () => {
        describe("Laravel Tests", () => {
            it("test average method", () => {
                // CollectionTest::testGettingAvgItemsFromCollection, through the average() alias
                const c = collect([{ foo: 10 }, { foo: 20 }]);
                expect(
                    c.average((item) => {
                        return item.foo;
                    }),
                ).toBe(15);
                expect(c.average("foo")).toBe(15);
                expect(
                    c.average((item) => {
                        return item.foo;
                    }),
                ).toBe(15);

                const d = collect([
                    { foo: 10 },
                    { foo: 20 },
                    { foo: null },
                    { foo: "house" },
                ]);
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-avg-non-numeric-string"
                expect(() =>
                    d.average((item) => {
                        return item.foo;
                    }),
                ).toThrow(
                    new TypeError("Unsupported operand types: int + string"),
                );
                expect(() => d.average("foo")).toThrow(
                    new TypeError("Unsupported operand types: int + string"),
                );

                const e = collect([{ foo: 10 }, { foo: 20 }]);
                expect(e.average("foo")).toBe(15);
                expect(
                    e.average((item) => {
                        return item.foo;
                    }),
                ).toBe(15);

                const f = collect([1, 2, 3, 4, 5]);
                expect(f.average()).toBe(3);

                const g = collect();
                expect(g.average()).toBeNull();

                const h = collect([{ foo: "4" }, { foo: "2" }]);
                expect(typeof h.average("foo")).toBe("number");
                expect(h.average("foo")).toBe(3);

                const i = collect([{ foo: 1 }, { foo: 2 }]);
                expect(typeof i.average("foo")).toBe("number");
                expect(i.average("foo")).toBe(1.5);

                const j = collect([{ foo: 1 }, { foo: 2 }, { foo: 6 }]);
                expect(j.average("foo")).toBe(3);

                const k = collect([0]);
                expect(k.average()).toBe(0);
            });
        });

        it("handles null/undefined values", () => {
            const c = collect([
                { val: 10 },
                { val: null },
                { val: 20 },
                { val: undefined },
            ]);
            // JS-only: undefined stands for a value PHP does not have, so it is skipped with null
            expect(c.average("val")).toBe(15);
        });

        it("throws PHP's TypeError for a non-numeric value", () => {
            const c = collect([{ val: 10 }, { val: "not a number" }]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-avg-non-numeric-string"
            expect(() => c.average("val")).toThrow(
                new TypeError("Unsupported operand types: int + string"),
            );
        });
    });

    describe("some", () => {
        describe("Laravel Tests", () => {
            it("test some", () => {
                // CollectionTest::testSome
                const c = collect([1, 3, 5]);

                expect(c.some(1)).toBe(true);
                expect(c.some(2)).toBe(false);
                expect(
                    c.some((value) => {
                        return value < 5;
                    }),
                ).toBe(true);
                expect(
                    c.some((value) => {
                        return value > 5;
                    }),
                ).toBe(false);

                const rows = collect([{ v: 1 }, { v: 3 }, { v: 5 }]);

                expect(rows.some("v", 1)).toBe(true);
                expect(rows.some("v", 2)).toBe(false);

                const d = collect(["date", "class", { foo: 50 }]);

                expect(d.some("date")).toBe(true);
                expect(d.some("class")).toBe(true);
                expect(d.some("foo")).toBe(false);

                const e = collect([
                    { a: false, b: false },
                    { a: true, b: false },
                ]);

                expect(
                    e.some((value) => {
                        return value.a;
                    }),
                ).toBe(true);
                expect(
                    e.some((value) => {
                        return value.b;
                    }),
                ).toBe(false);

                const f = collect([null, 1, 2]);

                expect(
                    f.some((value) => {
                        return value === null;
                    }),
                ).toBe(true);
            });
        });

        it("reads an explicit undefined second argument as PHP's null", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-two-args-null-value-others"
            expect([
                collect([{ a: null }, { a: 1 }]).some("a", null),
                collect([{ a: 1 }]).some("a", null),
            ]).toEqual([true, false]);

            // JS-only: an explicit undefined stands for PHP's null, so it counts as a second argument
            expect([
                collect([{ a: null }, { a: 1 }]).some("a", undefined),
                collect([{ a: 1 }]).some("a", undefined),
            ]).toEqual([true, false]);
        });
    });

    describe("dump", () => {
        it("test dump", () => {
            const log = vi.spyOn(console, "log").mockImplementation(() => {});

            try {
                new Collection([1, 2, 3]).dump("one", "two");

                // CollectionTest::testDump
                expect(log.mock.calls).toEqual([[[1, 2, 3], "one", "two"]]);
            } finally {
                log.mockRestore();
            }
        });

        it("returns the collection it dumped", () => {
            const log = vi.spyOn(console, "log").mockImplementation(() => {});

            try {
                const collection = collect([1]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-dump-returns-same-instance"
                expect(collection.dump()).toBe(collection);
            } finally {
                log.mockRestore();
            }
        });
    });

    describe("each", () => {
        it("hands the callback PHP's key, so a non-canonical one stays a string", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "chunkBy-noncanonical-key-type":
            // PHP keeps "01" a string key; only a canonical integer string is stored as an int.
            const seen: PropertyKey[] = [];

            collect({ "01": "a", "10": "b", x: "c" }).each((_value, key) => {
                seen.push(key);
            });

            expect(seen).toEqual([10, "01", "x"]);
        });

        describe("Laravel Tests", () => {
            it("test each", () => {
                // CollectionTest::testEach
                const original = { 0: 1, 1: 2, foo: "bar", bam: "baz" };
                const c = collect(original);

                let result: Record<PropertyKey, unknown> = {};
                const keys: PropertyKey[] = [];
                c.each((item, key) => {
                    result[key] = item;
                    keys.push(key);
                });
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-each-mixed-keys"
                expect(result).toEqual(original);
                expect(keys).toEqual([0, 1, "foo", "bam"]);

                result = {};
                c.each((item, key) => {
                    result[key] = item;
                    if (isString(key)) {
                        return false;
                    }
                    return;
                });
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-each-stop-on-string-key"
                expect(result).toEqual({ 0: 1, 1: 2, foo: "bar" });
            });

            it("test each spread", () => {
                // CollectionTest::testEachSpread
                const c = collect([
                    [1, "a"],
                    [2, "b"],
                ]);

                let result: unknown[] = [];
                c.eachSpread((number, character) => {
                    result.push([number, character]);
                });
                expect(result).toEqual(c.all());

                result = [];
                c.eachSpread((number, character) => {
                    result.push([number, character]);

                    return false;
                });
                expect(result).toEqual([[1, "a"]]);

                result = [];
                c.eachSpread((number, character, key) => {
                    result.push([number, character, key]);
                });
                expect(result).toEqual([
                    [1, "a", 0],
                    [2, "b", 1],
                ]);

                const c2 = collect([collect([1, "a"]), collect([2, "b"])]);
                result = [];
                c2.eachSpread((number, character, key) => {
                    result.push([number, character, key]);
                });
                expect(result).toEqual([
                    [1, "a", 0],
                    [2, "b", 1],
                ]);
            });
        });

        it.fails(
            "walks a Map-built collection in the order it holds its keys",
            () => {
                const keys: PropertyKey[] = [];

                outOfOrderKeys().each((_value, key) => {
                    keys.push(key);
                });

                // Ordered-backing gap: PHP's foreach walks the keys in insertion order, 2 before 0 and 1
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-each-out-of-order-keys"
                expect(keys).toEqual([2, 0, 1]);
            },
        );
    });

    describe("eachSpread", () => {
        describe("Laravel Tests", () => {
            it("test each spread", () => {
                // CollectionTest::testEachSpread
                const c = collect([
                    [1, "a"],
                    [2, "b"],
                ]);

                let result: unknown[] = [];
                c.eachSpread((number, character) => {
                    result.push([number, character]);
                });
                expect(result).toEqual(c.all());

                result = [];
                c.eachSpread((number, character, key) => {
                    result.push([number, character, key]);
                });
                expect(result).toEqual([
                    [1, "a", 0],
                    [2, "b", 1],
                ]);

                result = [];
                const c2 = collect([collect([1, "a"]), collect([2, "b"])]);
                c2.eachSpread((number, character, key) => {
                    result.push([number, character, key]);
                });
                expect(result).toEqual([
                    [1, "a", 0],
                    [2, "b", 1],
                ]);

                const d = new Collection([
                    new Collection([1, "a"]),
                    new Collection([2, "b"]),
                ]);
                result = [];
                d.eachSpread((number, character, key) => {
                    result.push([number, character, key]);
                });
                expect(result).toEqual([
                    [1, "a", 0],
                    [2, "b", 1],
                ]);
            });
        });

        it("stops when callback returns false", () => {
            const c = collect([
                [1, "a"],
                [2, "b"],
            ]);
            const seen: unknown[] = [];
            c.eachSpread((n, ch) => {
                seen.push([n, ch]);
                return false;
            });
            expect(seen).toEqual([[1, "a"]]);
        });

        it("spreads scalar items and passes index last", () => {
            // JS-only: PHP throws "Cannot use a scalar value as an array" for a scalar row, per
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-eachSpread-scalar-row"
            const c = collect([10, 20]);
            const args: unknown[] = [];
            c.eachSpread((value, key) => {
                args.push([value, key]);
            });
            expect(args).toEqual([
                [10, 0],
                [20, 1],
            ]);
        });

        it("passes plain objects as single arg and index last", () => {
            const obj1 = { x: 1 };
            const obj2 = { y: 2 };
            const c = collect([obj1, obj2]);
            const args: unknown[] = [];
            c.eachSpread((value, key) => {
                args.push([value, key]);
            });
            expect(args).toEqual([
                [obj1, 0],
                [obj2, 1],
            ]);
        });

        it("handles nested Collection of objects", () => {
            const c = collect([collect({ a: 1 }), collect({ b: 2 })]);
            const args: unknown[] = [];
            c.eachSpread((value, key) => {
                args.push([value, key]);
            });
            expect(args).toEqual([
                [{ a: 1 }, 0],
                [{ b: 2 }, 1],
            ]);
        });

        it("uses object keys when collection has string keys", () => {
            const c = collect({ first: [1, "a"], second: [2, "b"] });
            const args: unknown[] = [];
            c.eachSpread((n, ch, key) => {
                args.push([n, ch, key]);
            });
            expect(args).toEqual([
                [1, "a", "first"],
                [2, "b", "second"],
            ]);
        });

        it("returns the same collection instance", () => {
            const c = collect([[1, 2]]);
            const returned = c.eachSpread(() => {});
            expect(returned).toBe(c);
        });

        it("no-op on empty collection", () => {
            const c = collect<number[]>([]);
            const seen: unknown[] = [];
            c.eachSpread((...vals) => {
                seen.push(vals);
            });
            expect(seen).toEqual([]);
        });
    });

    describe("every", () => {
        describe("Laravel Tests", () => {
            it("test every", () => {
                // CollectionTest::testEvery
                const c = collect([]);
                expect(c.every("key", "value")).toBe(true);
                expect(
                    c.every(() => {
                        return false;
                    }),
                ).toBe(true);

                const d = collect([{ age: 18 }, { age: 20 }, { age: 20 }]);
                expect(d.every("age", 18)).toBe(false);
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-every-two-args-key-value"
                expect(
                    collect([{ age: 18 }, { age: 18 }]).every("age", 18),
                ).toBe(true);
                expect(
                    collect([{ status: "active" }, { status: "active" }]).every(
                        "status",
                        "active",
                    ),
                ).toBe(true);
                expect(d.every("age", ">=", 18)).toBe(true);
                expect(
                    d.every((item) => {
                        return item.age >= 18;
                    }),
                ).toBe(true);
                expect(
                    d.every((item) => {
                        return item.age >= 20;
                    }),
                ).toBe(false);

                const e = collect([null, null]);
                expect(
                    e.every((item) => {
                        return item === null;
                    }),
                ).toBe(true);

                const f = collect([{ active: true }, { active: true }]);
                expect(f.every("active")).toBe(true);
                expect(f.every((item) => item.active)).toBe(true);
                expect(
                    f.concat([{ active: false }]).every((item) => item.active),
                ).toBe(false);
            });
        });

        it("uses callback when operator and value are null", () => {
            const c = collect([1, 2, 3]);
            expect(c.every((v) => v > 0)).toBe(true);
            expect(c.every((v) => v > 2)).toBe(false);
        });

        it("uses operatorForWhere when operator provided", () => {
            const c = collect([{ status: "active" }, { status: "active" }]);
            expect(c.every("status", "=", "active")).toBe(true);
        });

        it("reads a null second argument as the value the key must equal", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-every-two-args-null-value"
            expect([
                collect([{ x: null }, { x: null }]).every("x", null),
                collect([{ x: 1 }]).every("x", null),
            ]).toEqual([true, false]);

            // JS-only: an explicit undefined stands for PHP's null, so it is a second argument too
            expect([
                collect([{ x: null }, { x: null }]).every("x", undefined),
                collect([{ x: 1 }]).every("x", undefined),
            ]).toEqual([true, false]);
        });

        it("compares loosely for a null operator, as PHP's switch falls to its default arm", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-every-null-operator"
            expect([
                collect([{ x: 5 }, { x: "5" }]).every("x", null, 5),
                collect([{ x: 5 }, { x: 6 }]).every("x", null, 5),
            ]).toEqual([true, false]);
        });

        it("judges a path's value, or the item itself, by PHP truthiness", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-every-path-php-falsy"
            expect([
                collect([{ a: "0" }]).every("a"),
                collect([{ a: [] }]).every("a"),
                collect(["0"]).every(null),
            ]).toEqual([false, false, false]);
        });

        it.fails(
            "calls a callback in a Map-built collection's insertion order",
            () => {
                const seen: number[] = [];
                outOfOrderKeys().every((_value, key) => {
                    seen.push(key);

                    return true;
                });

                // Ordered-backing gap: PHP walks the keys in insertion order, key 2 before 0 and 1
                // docs/php-parity/task-27-carried-fixes.json, "every-out-of-order-key-order"
                expect(seen).toEqual([2, 0, 1]);
            },
        );
    });

    describe("firstWhere", () => {
        describe("Laravel Tests", () => {
            it("test first where", () => {
                // CollectionTest::testFirstWhere
                const data = collect([
                    { material: "paper", type: "book" },
                    { material: "rubber", type: "gasket" },
                ]);

                expect(data.firstWhere("material", "paper")?.type).toBe("book");
                expect(data.firstWhere("material", "rubber")?.type).toBe(
                    "gasket",
                );
                expect(data.firstWhere("material", "nonexistent")).toBeNull();
                expect(data.firstWhere("nonexistent", "key")).toBeNull();

                expect(
                    data.firstWhere((value) => value.material === "paper")
                        ?.type,
                ).toBe("book");
                expect(
                    data.firstWhere((value) => value.material === "rubber")
                        ?.type,
                ).toBe("gasket");
                expect(
                    data.firstWhere(
                        (value) => value.material === "nonexistent",
                    ),
                ).toBeNull();
                expect(
                    // @ts-expect-error - intentionally accessing nonexistent property
                    data.firstWhere((value) => value.nonexistent === "key"),
                ).toBeNull();
            });

            it("test first where using enum", () => {
                // CollectionTest::testFirstWhereUsingEnum, whose unit enum cases are their names here
                const data = collect([
                    { id: 1, name: StaffEnum.Taylor },
                    { id: 2, name: StaffEnum.Joe },
                    { id: 3, name: StaffEnum.James },
                ]);

                expect(data.firstWhere("name", "Taylor")?.id).toBe(1);
                expect(data.firstWhere("name", StaffEnum.Joe)?.id).toBe(2);
                expect(data.firstWhere("name", StaffEnum.James)?.id).toBe(3);
            });
        });

        it("uses operatorForWhere", () => {
            const c = collect([{ id: 1 }, { id: 2 }, { id: 3 }]);
            expect(c.firstWhere("id", ">=", 2)).toEqual({ id: 2 });
        });

        it("reads a null second argument as the value the key must equal", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-two-args-null-value"
            expect(
                collect([{ a: 1 }, { a: null }]).firstWhere("a", null),
            ).toEqual({ a: null });
        });

        it("reads an explicit undefined second argument as PHP's null", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-two-args-null-value":
            // PHP's answer for a null second argument. JS-only: an explicit undefined stands for that null
            expect(
                collect([{ a: 1 }, { a: null }]).firstWhere("a", undefined),
            ).toEqual({ a: null });
        });
    });

    describe("value", () => {
        describe("Laravel Tests", () => {
            it("test value", () => {
                // CollectionTest::testValue
                const c = collect([
                    { id: 1, name: "Hello" },
                    { id: 2, name: "World" },
                ]);

                expect(c.value("name")).toBe("Hello");
                expect(c.where("id", 2).value("name")).toBe("World");

                const d = collect([
                    { id: 1, pivot: { value: "foo" } },
                    { id: 2, pivot: { value: "bar" } },
                ]);

                expect(d.value("pivot")).toEqual({ value: "foo" });
                expect(d.value("pivot.value")).toBe("foo");
                expect(d.where("id", 2).value("pivot.value")).toBe("bar");
            });

            it("test value using enum", () => {
                // CollectionTest::testValueUsingEnum, whose unit enum cases are their names here
                const c = collect([
                    { id: 1, name: StaffEnum.Taylor },
                    { id: 2, name: StaffEnum.Joe },
                ]);

                expect(c.value("name")).toBe(StaffEnum.Taylor);
                expect(c.where("id", 2).value("name")).toBe(StaffEnum.Joe);
            });

            it("test value with negative value", () => {
                // CollectionTest::testValueWithNegativeValue
                const c = collect([
                    { id: 1, balance: 0 },
                    { id: 2, balance: 200 },
                ]);

                expect(c.value("balance")).toBe(0);

                const d = collect([
                    { id: 1, balance: "" },
                    { id: 2, balance: 200 },
                ]);

                expect(d.value("balance")).toBe("");

                const e = collect([
                    { id: 1, balance: null },
                    { id: 2, balance: 200 },
                ]);

                expect(e.value("balance")).toBeNull();

                const f = collect([{ id: 1 }, { id: 2, balance: 200 }]);

                expect(f.value("balance")).toBe(200);

                const g = collect([
                    { id: 1 },
                    { id: 2, balance: 0 },
                    { id: 3, balance: 200 },
                ]);

                expect(g.value("balance")).toBe(0);
            });

            it("test value with objects", () => {
                // CollectionTest::testValueWithObjects
                const c = collect([
                    { id: 1 },
                    { id: 2, balance: "" },
                    { id: 3, balance: 200 },
                ]);

                expect(c.value("balance")).toBe("");

                const d = collect([
                    { id: 1 },
                    { id: 2, balance: { currency: "USD", value: 0 } },
                    { id: 3, balance: { currency: "USD", value: 200 } },
                ]);

                expect(d.value("balance.value")).toBe(0);
            });
        });

        it("resolves the default when no item holds the key", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-value-default"
            expect([
                collect([{ a: 1 }]).value("b", () => "d"),
                collect([{ a: 1 }]).value("b", "d"),
                collect([]).value("a"),
            ]).toEqual(["d", "d", null]);
        });
    });

    describe("ensure", () => {
        describe("Laravel Tests", () => {
            it("test ensure for scalar", () => {
                // CollectionTest::testEnsureForScalar
                const data = collect([1, 2, 3]);
                data.ensure("int");

                const data2 = collect([1, 2, 3, "foo"]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-ensure-scalar-message"
                expect(() => data2.ensure("int")).toThrow(
                    new UnexpectedValueException(
                        "Collection should only include [int] items, but 'string' found at position 3.",
                    ),
                );
            });

            it("test ensure for objects", () => {
                // CollectionTest::testEnsureForObjects
                class stdClass {}

                const data = collect([
                    new stdClass(),
                    new stdClass(),
                    new stdClass(),
                ]);
                data.ensure(stdClass);

                const data2 = collect([
                    new stdClass(),
                    new stdClass(),
                    new stdClass(),
                    Collection.name,
                ]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-ensure-class-message"
                expect(() => data2.ensure(stdClass)).toThrow(
                    new UnexpectedValueException(
                        "Collection should only include [stdClass] items, but 'string' found at position 3.",
                    ),
                );
            });

            it("test ensure for inheritance", () => {
                // CollectionTest::testEnsureForInheritance
                const data = collect([new TypeError(), new RangeError()]);
                data.ensure(Error);

                const wrongType = new Collection();
                const data2 = collect([
                    new TypeError(),
                    new RangeError(),
                    wrongType,
                ]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-ensure-inheritance-message"
                // JS-only: Error roots JavaScript's errors where Throwable roots PHP's, and a class has no namespace
                expect(() => data2.ensure(Error)).toThrow(
                    new UnexpectedValueException(
                        "Collection should only include [Error] items, but 'Collection' found at position 2.",
                    ),
                );
            });

            it("test ensure for multiple types", () => {
                // CollectionTest::testEnsureForMultipleTypes
                const data = collect([new Error(), 123]);
                data.ensure([Error, "int"]);

                const wrongType = new Collection();
                const data2 = collect([new Error(), new Error(), wrongType]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-ensure-multiple-message"
                // JS-only: Error stands in for PHP's Throwable, and a class has no namespace
                expect(() => data2.ensure([Error, "int"])).toThrow(
                    new UnexpectedValueException(
                        "Collection should only include [Error, int] items, but 'Collection' found at position 2.",
                    ),
                );
            });
        });

        it("handles object type values", () => {
            const c = collect(["hello", "world"]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-ensure-assoc-types"
            expect(c.ensure({ first: "string" }).all()).toEqual([
                "hello",
                "world",
            ]);
        });

        it("handles instanceof check", () => {
            class MyClass {
                constructor(public value: number) {}
            }
            const c = collect([new MyClass(1), new MyClass(2)]);

            // CollectionTest::testEnsureForObjects
            expect(() => c.ensure(MyClass)).not.toThrow();
        });

        it("accepts an instance of a subclass of the class it names", () => {
            class Parent {}
            class Child extends Parent {}

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-ensure-subclass-passes"
            expect(collect([new Child()]).ensure(Parent).count()).toBe(1);
        });

        it("accepts an object whose class it names as a string", () => {
            class Child {}

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-ensure-class-name-string"
            expect(collect([new Child()]).ensure("Child").count()).toBe(1);
        });

        it("matches a class named as a string only exactly, where the class itself takes subclasses", () => {
            class Parent {}
            class Child extends Parent {}

            // JS-only: PHP's instanceof resolves a class name to take its subclasses; JavaScript cannot resolve one
            expect(() => collect([new Child()]).ensure("Parent")).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [Parent] items, but 'Child' found at position 0.",
                ),
            );
            expect(collect([new Child()]).ensure(Parent).count()).toBe(1);
        });

        it("accepts null for the null type", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-ensure-null-passes"
            expect(collect([null]).ensure("null").all()).toEqual([null]);
        });

        it("accepts a plain object for the array type, as the array it stands for", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-ensure-array-accepts-assoc"
            expect(
                collect([{ a: 1 }])
                    .ensure("array")
                    .count(),
            ).toBe(1);
        });

        it("names a null item null, as get_debug_type does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-ensure-array-rejects-null"
            expect(() => collect([null]).ensure("array")).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [array] items, but 'null' found at position 0.",
                ),
            );
        });

        it("returns the collection it checked", () => {
            const collection = collect([1]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-ensure-returns-same-instance"
            expect(collection.ensure("int")).toBe(collection);
        });

        it("prints a string key's position as PHP's %d does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-ensure-keyed-position"
            expect(() => collect({ a: 1, b: "x" }).ensure("int")).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [int] items, but 'string' found at position 0.",
                ),
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-ensure-numeric-prefix-key-position"
            expect(() => collect({ "3x": "a" }).ensure("int")).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [int] items, but 'string' found at position 3.",
                ),
            );
        });

        it("names what it found as get_debug_type does, a plain object as an array", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-ensure-debug-type-names"
            expect(() => collect([1]).ensure("string")).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [string] items, but 'int' found at position 0.",
                ),
            );
            expect(() => collect([1.5]).ensure("string")).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [string] items, but 'float' found at position 0.",
                ),
            );
            expect(() => collect([NaN]).ensure("string")).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [string] items, but 'float' found at position 0.",
                ),
            );
            expect(() => collect([true]).ensure("string")).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [string] items, but 'bool' found at position 0.",
                ),
            );
            expect(() => collect([{ a: 1 }]).ensure("string")).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [string] items, but 'array' found at position 0.",
                ),
            );
        });

        it("accepts JavaScript's own type names beside PHP's", () => {
            // JS-only: number, boolean, symbol, bigint, function and undefined are JavaScript's type names
            expect(collect([1, 1.5]).ensure("number").count()).toBe(2);
            expect(collect([true]).ensure("boolean").count()).toBe(1);
            expect(
                collect([Symbol("s")])
                    .ensure("symbol")
                    .count(),
            ).toBe(1);
            expect(collect([1n]).ensure("bigint").count()).toBe(1);
            expect(
                collect([() => 1])
                    .ensure("function")
                    .count(),
            ).toBe(1);
        });

        it("takes the object type as any object but null and an array", () => {
            // JS-only: PHP has no object type name; a Collection is an object like any other
            expect(
                collect([{}, new Date(0), new Collection()])
                    .ensure("object")
                    .count(),
            ).toBe(3);
            expect(() => collect([null]).ensure("object")).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [object] items, but 'null' found at position 0.",
                ),
            );
            expect(() => collect([[1]]).ensure("object")).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [object] items, but 'array' found at position 0.",
                ),
            );
        });

        it("reads undefined as null, and as its own undefined type", () => {
            // JS-only: undefined is read as PHP's null
            expect(collect([undefined]).ensure("null").count()).toBe(1);
            expect(collect([undefined]).ensure("undefined").count()).toBe(1);
        });

        it("names a closure and an anonymous class as get_debug_type() does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-A-ensure-closure-and-anonymous-class-names"
            expect(() => collect([new (class {})()]).ensure("int")).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [int] items, but 'class@anonymous' found at position 0.",
                ),
            );
            expect(() => collect([() => 1]).ensure("int")).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [int] items, but 'Closure' found at position 0.",
                ),
            );
            expect(
                collect([() => 1])
                    .ensure("Closure")
                    .count(),
            ).toBe(1);
        });

        it("names an instance of an anonymous subclass after the class it extends, as get_debug_type() does", () => {
            class Parent {}
            class Child extends Parent {}

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-ensure-anonymous-subclass-name"
            expect(() =>
                collect([new (class extends Parent {})()]).ensure("int"),
            ).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [int] items, but 'Parent@anonymous' found at position 0.",
                ),
            );
            expect(() =>
                collect([new (class extends Child {})()]).ensure("int"),
            ).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [int] items, but 'Child@anonymous' found at position 0.",
                ),
            );
        });

        it("names a number past PHP's int range, or -0, float, as get_debug_type() does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-debug-type-float-past-int-range"
            expect(() => collect([1e19]).ensure("int")).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [int] items, but 'float' found at position 0.",
                ),
            );
            expect(() => collect([-0]).ensure("int")).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [int] items, but 'float' found at position 0.",
                ),
            );
        });

        it("names what PHP has no type for by its JavaScript type", () => {
            const orphan: unknown = Object.create(Object.create(null));

            // JS-only: a symbol, a bigint and an object with no class have no PHP type name
            expect(() => collect([orphan]).ensure("string")).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [string] items, but 'object' found at position 0.",
                ),
            );
            expect(() => collect([Symbol("s")]).ensure("string")).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [string] items, but 'symbol' found at position 0.",
                ),
            );
            expect(() => collect([1n]).ensure("string")).toThrow(
                new UnexpectedValueException(
                    "Collection should only include [string] items, but 'bigint' found at position 0.",
                ),
            );
        });
    });

    describe("mapSpread", () => {
        describe("Laravel Tests", () => {
            it("test map spread", () => {
                // CollectionTest::testMapSpread
                const c = collect([
                    [1, "a"],
                    [2, "b"],
                ]);

                const result = c.mapSpread((number, character) => {
                    return `${number}-${character}`;
                });
                expect(result.all()).toEqual(["1-a", "2-b"]);

                const result2 = c.mapSpread((number, character, key) => {
                    return `${number}-${character}-${key}`;
                });
                expect(result2.all()).toEqual(["1-a-0", "2-b-1"]);

                const d = new Collection([
                    new Collection([1, "a"]),
                    new Collection([2, "b"]),
                ]);

                const result3 = d.mapSpread((number, character, key) => {
                    return `${number}-${character}-${key}`;
                });
                expect(result3.all()).toEqual(["1-a-0", "2-b-1"]);
            });
        });

        it("spreads a scalar row as a lone value, then its key", () => {
            // JS-only: PHP throws "Cannot use a scalar value as an array" for a scalar row, per
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-mapSpread-scalar-row"
            expect(
                collect([10, 20])
                    .mapSpread((...values) => values)
                    .all(),
            ).toEqual([
                [10, 0],
                [20, 1],
            ]);
        });

        it("spreads a list row and appends the key, through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "mapSpread-tuples", "mapSpread-tuples-key"
            const result = collect({ x: [1, "a"], y: [2, "b"] }).mapSpread(
                (n, c) => `${String(n)}-${String(c)}`,
            );
            expect(result.all()).toEqual({ x: "1-a", y: "2-b" });

            // The callback's third argument is the appended key.
            const resultWithKey = collect({
                x: [1, "a"],
                y: [2, "b"],
            }).mapSpread((n, c, k) => `${String(n)}-${String(c)}-${String(k)}`);
            expect(resultWithKey.all()).toEqual({
                x: "1-a-x",
                y: "2-b-y",
            });
        });

        it.fails(
            "keeps a Map-built collection's keys in the order it holds them",
            () => {
                const mapped = collect(
                    new Map([
                        [2, ["c", 1]],
                        [0, ["a", 2]],
                        [1, ["b", 3]],
                    ]),
                ).mapSpread((...values) => values.join(""));

                // Ordered-backing gap: PHP keeps the keys in insertion order, 2 before 0 and 1
                // docs/php-parity/task-30-map-order.json, "mapSpread-out-of-order"
                expect(mapped.keys().all()).toEqual([2, 0, 1]);
                expect(mapped.values().all()).toEqual(["c12", "a20", "b31"]);
            },
        );
    });

    describe("mapToGroups", () => {
        describe("Laravel Tests", () => {
            it("test map to groups", () => {
                // CollectionTest::testMapToGroups
                const data = collect([
                    { id: 1, name: "A" },
                    { id: 2, name: "B" },
                    { id: 3, name: "C" },
                    { id: 4, name: "B" },
                ]);

                const groups = data.mapToGroups((item) => {
                    return { [item.name]: item.id };
                });

                expect(groups).toBeInstanceOf(Collection);
                expect(groups.toArray()).toEqual({ A: [1], B: [2, 4], C: [3] });
                expect(groups.get("A")).toBeInstanceOf(Collection);
            });

            it("test map to groups with numeric keys", () => {
                // CollectionTest::testMapToGroupsWithNumericKeys
                const data = collect([1, 2, 3, 2, 1]);

                const groups = data.mapToGroups((item, key) => {
                    return { [item]: key };
                });

                expect(groups.toArray()).toEqual({
                    1: [0, 4],
                    2: [1, 3],
                    3: [2],
                });
                expect(data.all()).toEqual([1, 2, 3, 2, 1]);
            });
        });
    });

    describe("flatMap", () => {
        describe("Laravel Tests", () => {
            it("test flat map", () => {
                // CollectionTest::testFlatMap
                const data = collect([
                    {
                        name: "taylor",
                        hobbies: ["programming", "basketball"],
                    },
                    {
                        name: "adam",
                        hobbies: ["music", "powerlifting"],
                    },
                ]);

                const flatMapped = data.flatMap((person) => {
                    return person.hobbies;
                });

                expect(flatMapped.all()).toEqual([
                    "programming",
                    "basketball",
                    "music",
                    "powerlifting",
                ]);
            });
        });

        it("returns a list from a record receiver whose callback returns lists", () => {
            const flattened = collect({ a: 1, b: 2 }).flatMap((value) => [
                value,
                value * 10,
            ]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-flatMap-record-receiver"
            expect(flattened.all()).toEqual([1, 10, 2, 20]);
            expect(flattened.keys().all()).toEqual([0, 1, 2, 3]);
            expect(flattened.values().all()).toEqual([1, 10, 2, 20]);
        });
    });

    describe("mapInto", () => {
        describe("Laravel Tests", () => {
            it("test map into", () => {
                // CollectionTest::testMapInto
                const data = collect(["first", "second"]);

                const mapped = data.mapInto(TestCollectionMapIntoObject);
                expect(mapped.all()).toEqual([
                    new TestCollectionMapIntoObject("first"),
                    new TestCollectionMapIntoObject("second"),
                ]);

                expect(mapped.get(0)!.value).toBe("first");
                expect(mapped.get(1)!.value).toBe("second");
            });

            it("test map into with int backed enums", () => {
                // CollectionTest::testMapIntoWithIntBackedEnums
                const data = collect([1, 2]).mapInto(TestBackedEnum);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-mapInto-backed-enums": each
                // from() builds a new case object, so a case compares by value where PHP's is the same instance
                expect(data.get(0)).toEqual(TestBackedEnum.from(1));
                expect(data.get(1)).toEqual(TestBackedEnum.from(2));
                expect(data.pluck("name").all()).toEqual(["A", "B"]);
            });

            it("test map into with string backed enums", () => {
                // CollectionTest::testMapIntoWithStringBackedEnums
                const data = collect(["A", "B"]).mapInto(TestStringBackedEnum);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-mapInto-backed-enums"
                expect(data.get(0)).toEqual(TestStringBackedEnum.from("A"));
                expect(data.get(1)).toEqual(TestStringBackedEnum.from("B"));
                expect(data.pluck("name").all()).toEqual(["A", "B"]);
            });
        });

        it("builds a pure enum definition as it would a class, which throws", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-mapInto-pure-enum"
            // JS-only: a definition is no class, so the error is a TypeError, not PHP's "Cannot instantiate enum"
            expect(() => collect(["A"]).mapInto(TestEnum)).toThrow(TypeError);
            expect(() => collect(["A"]).mapInto(TestEnum)).toThrow(
                "is not a constructor",
            );
        });

        it("hands the class each value and its key", () => {
            class RecordsArguments {
                public args: unknown[];

                constructor(...args: unknown[]) {
                    this.args = args;
                }
            }

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-mapInto-constructor-args"
            expect(
                collect(["first", "second"])
                    .mapInto(RecordsArguments)
                    .map((object) => object.args)
                    .all(),
            ).toEqual([
                ["first", 0],
                ["second", 1],
            ]);
            const keyed = collect({ x: "first" })
                .mapInto(RecordsArguments)
                .map((object) => object.args);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-mapInto-constructor-args-assoc"
            expect(keyed.all()).toEqual({ x: ["first", "x"] });
            expect(keyed.keys().all()).toEqual(["x"]);
            expect(keyed.values().all()).toEqual([["first", "x"]]);
        });
    });

    describe("min", () => {
        describe("Laravel Tests", () => {
            it("test min", () => {
                // CollectionTest::testGettingMinItemsFromCollection, but for its ->min->foo proxies, not ported
                const c = collect([{ foo: 10 }, { foo: 20 }]);

                expect(c.min((item) => item.foo)).toBe(10);

                expect(c.min("foo")).toBe(10);
                expect(c.min((item) => item.foo)).toBe(10);

                const d = collect([{ foo: 10 }, { foo: 20 }]);
                expect(d.min("foo")).toBe(10);
                expect(d.min((item) => item.foo)).toBe(10);

                const e = collect([{ foo: 10 }, { foo: 20 }, { foo: null }]);
                expect(e.min("foo")).toBe(10);
                expect(e.min((item) => item.foo)).toBe(10);

                const f = collect([1, 2, 3, 4, 5]);
                expect(f.min()).toBe(1);

                const g = collect([1, null, 3, 4, 5]);
                expect(g.min()).toBe(1);

                const h = collect([0, 1, 2, 3, 4]);
                expect(h.min()).toBe(0);

                const i = collect();
                expect(i.min()).toBeNull();
            });
        });

        it("compares numeric strings as numbers, as PHP's < does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-min-numeric-strings"
            expect(collect(["10", "9", "8"]).min()).toBe("8");
        });

        it("skips a null item, and undefined with it", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-min-max-null-items"
            expect([
                collect([null, 3, 1]).min(),
                collect([null]).min(),
            ]).toEqual([1, null]);
            // JS-only: undefined stands for PHP's null, so it is skipped with it
            expect([
                collect([undefined, 3, 1]).min(),
                collect([undefined]).min(),
            ]).toEqual([1, null]);
        });

        it("compares other strings as text, and never throws", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-min-max-strings"
            expect(collect(["b", "a", "c"]).min()).toBe("a");
        });

        it("keeps the first of two arrays neither orders, as PHP's < does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-min-max-uncomparable-arrays"
            expect([
                collect([[1], { a: 1 }]).min(),
                collect([{ a: 1 }, [1]]).min(),
            ]).toEqual([[1], { a: 1 }]);
        });

        it("hands the callback the value alone, as PHP does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-min-max-callback-arity"
            expect(collect({ a: 1 }).min((...args) => args.length)).toBe(1);
        });

        it.fails(
            "keeps the value it meets first through a tie, walking a Map-built collection in order",
            () => {
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-min-max-out-of-order-tie"
                // Ordered-backing gap: PHP meets the '1' under key 2 first and keeps it through its tie with key 0's 1
                expect(
                    collect(
                        new Map<number, string | number>([
                            [2, "1"],
                            [0, 1],
                        ]),
                    ).min(),
                ).toBe("1");
            },
        );
    });

    describe("max", () => {
        describe("Laravel Tests", () => {
            it("test max", () => {
                // CollectionTest::testGettingMaxItemsFromCollection, but for its ->max->foo proxies, not ported
                const c = collect([{ foo: 10 }, { foo: 20 }]);

                expect(c.max((item) => item.foo)).toBe(20);

                expect(c.max("foo")).toBe(20);
                expect(c.max((item) => item.foo)).toBe(20);

                const d = collect([{ foo: 10 }, { foo: 20 }]);

                expect(d.max("foo")).toBe(20);
                expect(d.max((item) => item.foo)).toBe(20);

                const e = collect([1, 2, 3, 4, 5]);
                expect(e.max()).toBe(5);

                const f = collect();
                expect(f.max()).toBeNull();
            });
        });

        it("keeps an earlier value that no later value exceeds", () => {
            // docs/php-parity/task-31-laravel-13-33-sync.json, "max-keeps-earlier-larger-value"
            // and "max-key-keeps-earlier-larger-value"
            expect(collect([3, 1, 2]).max()).toBe(3);
            expect(collect([{ foo: 20 }, { foo: 10 }]).max("foo")).toBe(20);
        });

        it("compares numeric strings as numbers, as PHP's > does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-max-numeric-strings"
            expect(collect(["10", "9", "8"]).max()).toBe("10");
        });

        it("skips a null item, and undefined with it", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-min-max-null-items"
            expect([
                collect([null, 3, 1]).max(),
                collect([null]).max(),
            ]).toEqual([3, null]);
            // JS-only: undefined stands for PHP's null, so it is skipped with it
            expect([
                collect([undefined, 3, 1]).max(),
                collect([undefined]).max(),
            ]).toEqual([3, null]);
        });

        it("gives way to the next value after a null callback answer, and undefined with it", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-max-null-callback-answers"
            expect([
                collect([1, 2]).max(() => null),
                collect([1, 2]).max((value) => (value === 1 ? null : 0)),
            ]).toEqual([null, 0]);
            // JS-only: undefined stands for PHP's null, so it is read as null
            expect([
                collect([1, 2]).max(() => undefined),
                collect([1, 2]).max((value) => (value === 1 ? undefined : 0)),
            ]).toEqual([null, 0]);
        });

        it("compares other strings as text, and never throws", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-min-max-strings"
            expect(collect(["b", "a", "c"]).max()).toBe("c");
        });

        it("keeps the first of two arrays neither orders, as PHP's > does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-min-max-uncomparable-arrays"
            expect([
                collect([[1], { a: 1 }]).max(),
                collect([{ a: 1 }, [1]]).max(),
            ]).toEqual([[1], { a: 1 }]);
        });

        it("hands the callback the value alone, as PHP does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-min-max-callback-arity"
            expect(collect({ a: 1 }).max((...args) => args.length)).toBe(1);
        });

        it.fails(
            "keeps the value it meets first through a tie, walking a Map-built collection in order",
            () => {
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-min-max-out-of-order-tie"
                // Ordered-backing gap: PHP meets the '1' under key 2 first and keeps it through its tie with key 0's 1
                expect(
                    collect(
                        new Map<number, string | number>([
                            [2, "1"],
                            [0, 1],
                        ]),
                    ).max(),
                ).toBe("1");
            },
        );

        it("reads a dot path through each item", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-max-dot-path"
            expect(collect([{ a: { b: 3 } }, { a: { b: 7 } }]).max("a.b")).toBe(
                7,
            );
        });
    });

    describe("forPage", () => {
        describe("Laravel Tests", () => {
            it("test paginate", () => {
                // CollectionTest::testPaginate
                const c = collect(["one", "two", "three", "four"]);
                expect(c.forPage(0, 2).all()).toEqual(["one", "two"]);
                expect(c.forPage(1, 2).all()).toEqual(["one", "two"]);
                expect(c.forPage(2, 2).all()).toEqual(["three", "four"]);
                expect(c.forPage(3, 2).all()).toEqual([]);
            });
        });

        it("reads a page below 1 as the first, and a page size of 0 or below as array_slice reads it", () => {
            const c = collect(["one", "two", "three", "four"]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-forPage-edges"
            expect(c.forPage(-1, 2).all()).toEqual(["one", "two"]);
            expect(c.forPage(2, 0).all()).toEqual([]);
            expect(c.forPage(1, -1).all()).toEqual(["one", "two", "three"]);
        });

        it("keeps a record's keys on its page", () => {
            const page = collect({ a: 1, b: 2, c: 3 }).forPage(2, 1);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-forPage-assoc"
            expect(viewsOf(page)).toEqual({
                all: { b: 2 },
                keys: ["b"],
                values: [2],
            });
        });
    });

    describe("partition", () => {
        describe("Laravel Tests", () => {
            it("test partition", () => {
                // CollectionTest::testPartition
                const data = collect(Collection.range(1, 10));

                const [firstPartition, secondPartition] = data
                    .partition((i) => {
                        return i <= 5;
                    })
                    .all();

                expect(firstPartition!.values().all()).toEqual([1, 2, 3, 4, 5]);
                expect(secondPartition!.values().all()).toEqual([
                    6, 7, 8, 9, 10,
                ]);
            });

            it("test partition callback with key", () => {
                // CollectionTest::testPartitionCallbackWithKey
                const data = collect(["zero", "one", "two", "three"]);

                const [even, odd] = data
                    .partition((_item, index) => {
                        return index % 2 === 0;
                    })
                    .all();

                expect(even!.values().all()).toEqual(["zero", "two"]);
                expect(odd!.values().all()).toEqual(["one", "three"]);
            });

            it("test partition by key", () => {
                // CollectionTest::testPartitionByKey
                const courses = collect([
                    { free: true, title: "Basic" },
                    { free: false, title: "Premium" },
                ]);

                const [free, premium] = courses.partition("free").all();

                expect(free!.values().all()).toEqual([
                    { free: true, title: "Basic" },
                ]);
                expect(premium!.values().all()).toEqual([
                    { free: false, title: "Premium" },
                ]);
            });

            it("test partition with operators", () => {
                // CollectionTest::testPartitionWithOperators
                const data = collect([
                    { name: "Tim", age: 17 },
                    { name: "Agatha", age: 62 },
                    { name: "Kristina", age: 33 },
                    { name: "Tim", age: 41 },
                ]);

                const [tims, others] = data.partition("name", "Tim").all();

                expect(tims!.values().all()).toEqual([
                    { name: "Tim", age: 17 },
                    { name: "Tim", age: 41 },
                ]);

                expect(others!.values().all()).toEqual([
                    { name: "Agatha", age: 62 },
                    { name: "Kristina", age: 33 },
                ]);

                const [adults, minors] = data.partition("age", ">=", 18).all();

                expect(adults!.values().all()).toEqual([
                    { name: "Agatha", age: 62 },
                    { name: "Kristina", age: 33 },
                    { name: "Tim", age: 41 },
                ]);

                expect(minors!.values().all()).toEqual([
                    { name: "Tim", age: 17 },
                ]);
            });

            it("test partition preserves keys", () => {
                // CollectionTest::testPartitionPreservesKeys
                const courses = collect({
                    a: { free: true },
                    b: { free: false },
                    c: { free: true },
                });

                const [free, premium] = courses.partition("free").all();

                expect(free!.toArray()).toEqual({
                    a: { free: true },
                    c: { free: true },
                });
                expect(premium!.toArray()).toEqual({
                    b: { free: false },
                });
            });

            it("test partition empty collection", () => {
                // CollectionTest::testPartitionEmptyCollection
                const data = collect();

                expect(
                    data
                        .partition(() => {
                            return true;
                        })
                        .all().length,
                ).toBe(2);
            });
        });

        it("uses valueRetriever when no operator/value", () => {
            const c = collect([1, 2, 3, 4, 5]);
            const [truthy, falsy] = c.partition((v) => v > 3);
            expect(truthy.all()).toEqual([4, 5]);
            expect(falsy.all()).toEqual([1, 2, 3]);
        });

        it("uses operatorForWhere when operator provided", () => {
            const c = collect([{ status: "active" }, { status: "inactive" }]);
            const [active, inactive] = c.partition("status", "=", "active");
            expect(active.all()).toEqual([{ status: "active" }]);
            expect(inactive.all()).toEqual([{ status: "inactive" }]);
        });

        it("compares with PHP's != for that operator", () => {
            const [passed, failed] = collect([
                { v: 1 },
                { v: "1" },
                { v: 2 },
            ]).partition("v", "!=", 1);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-partition-not-equal-operator", whose
            // keys [2] and [0, 1] name these rows; a list half renumbers its keys, as every removal from a list does
            expect([passed.pluck("v").all(), failed.pluck("v").all()]).toEqual([
                [2],
                [1, "1"],
            ]);
        });

        it("reads each half by index, as PHP's $partition[0] and [1] read them", () => {
            const halves = collect({ a: 1, b: 2 }).partition(
                (value) => value > 1,
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-partition-offset-get"
            expect([halves[0].all(), halves[1].all()]).toEqual([
                { b: 2 },
                { a: 1 },
            ]);
            expect([
                halves[0].keys().all(),
                halves[0].values().all(),
                halves[1].keys().all(),
                halves[1].values().all(),
            ]).toEqual([["b"], [2], ["a"], [1]]);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-partition-outer-keys"
            expect(halves.keys().all()).toEqual([0, 1]);
            // JS-only: an index reads the items, as offsetGet() does, and is no own enumerable key of the collection
            expect(Object.keys(halves)).not.toContain("0");
        });

        it("reads an explicit undefined second argument as PHP's null", () => {
            const rows = () => collect([{ v: null }, { v: 0 }, { v: 1 }]);
            const [passed, failed] = rows().partition("v", null);
            const [passedUndefined, failedUndefined] = rows().partition(
                "v",
                undefined,
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-partition-two-arg-null", whose keys
            // [0, 1] and [2] name these rows; a list half renumbers its keys, as every removal from a list does
            expect([passed.pluck("v").all(), failed.pluck("v").all()]).toEqual([
                [null, 0],
                [1],
            ]);
            // JS-only: an explicit undefined stands for PHP's null, so it counts as a second argument
            expect([
                passedUndefined.pluck("v").all(),
                failedUndefined.pluck("v").all(),
            ]).toEqual([[null, 0], [1]]);
        });

        it("partitions the items themselves by PHP truthiness for a null key", () => {
            const [passed, failed] = collect([
                1,
                0,
                "",
                "a",
                null,
                [],
                "0",
            ]).partition(null);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-partition-null-key-truthiness"
            expect([passed.values().all(), failed.values().all()]).toEqual([
                [1, "a"],
                [0, "", null, [], "0"],
            ]);
        });

        it("counts every object as passing for a null key, however empty", () => {
            const [passed, failed] = collect([
                new Date(0),
                new (class {})(),
            ]).partition(null);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-partition-null-empty-objects"
            expect([passed.count(), failed.count()]).toEqual([2, 0]);
        });

        it("compares with a false value rather than testing the path's truthiness", () => {
            const [passed, failed] = collect([
                { v: false },
                { v: 0 },
                { v: null },
                { v: 1 },
            ]).partition("v", false);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-partition-bool-false-two-arg", whose
            // keys [0, 1, 2] and [3] name these rows; a list half renumbers its keys, as every removal from a list does
            expect([passed.pluck("v").all(), failed.pluck("v").all()]).toEqual([
                [false, 0, null],
                [1],
            ]);
        });
    });

    describe("percentage", () => {
        describe("Laravel Tests", () => {
            it("test percentage with flat collection", () => {
                // CollectionTest::testPercentageWithFlatCollection
                const c = collect([1, 1, 2, 2, 2, 3]);

                expect(c.percentage((value) => value === 1)).toBe(33.33);
                expect(c.percentage((value) => value === 2)).toBe(50.0);
                expect(c.percentage((value) => value === 3)).toBe(16.67);
                expect(c.percentage((value) => value === 5)).toBe(0.0);
            });

            it("test percentage with nested collection", () => {
                // CollectionTest::testPercentageWithNestedCollection
                const c = collect([
                    { name: "Taylor", foo: "foo" },
                    { name: "Nuno", foo: "bar" },
                    { name: "Dries", foo: "bar" },
                    { name: "Jess", foo: "baz" },
                ]);

                expect(c.percentage((value) => value.foo === "foo")).toBe(25.0);
                expect(c.percentage((value) => value.foo === "bar")).toBe(50.0);
                expect(c.percentage((value) => value.foo === "baz")).toBe(25.0);
                expect(c.percentage((value) => value.foo === "test")).toBe(0.0);
            });

            it("test percentage returns null for empty collections", () => {
                // CollectionTest::testPercentageReturnsNullForEmptyCollections
                const c = collect([]);

                expect(c.percentage((value) => value === 1)).toBeNull();
            });
        });

        it("rounds up from the double nearest the midpoint, as PHP's round() does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-percentage-fp-below-half" and
            // "C32-H-percentage-fp-just-below-half-rounds-up"
            expect([
                Collection.range(1, 2000).percentage((value) => value <= 9, 1),
                Collection.range(1, 2000).percentage((value) => value <= 3, 1),
            ]).toEqual([0.4, 0.2]);
        });

        it("rounds past fifteen places as PHP's round() does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-percentage-beyond-double-digits"
            // and "C32-H-percentage-scaled-just-short-of-whole"
            expect([
                Collection.range(1, 9).percentage((value) => value === 1, 15),
                Collection.range(1, 35).percentage((value) => value <= 3, 15),
            ]).toEqual([11.11111111111111, 8.571428571428573]);
        });

        it("rounds to tens for a negative precision, and past the largest power of ten a double holds", () => {
            const c = collect([1, 1, 2]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-percentage-precision-zero-and-negative"
            // and "C32-H-percentage-extreme-precision"
            expect([
                c.percentage((value) => value === 1, 0),
                c.percentage((value) => value === 1, -1),
                c.percentage((value) => value === 1, -400),
                c.percentage((value) => value === 1, 400),
                c.percentage((value) => value === 5, 400),
            ]).toEqual([67, 70, 0, 66.66666666666666, 0]);
        });

        it("drops a fraction from the precision, as PHP's int parameter does", () => {
            const c = collect([1, 1, 2]);
            const percentage = (precision: number) =>
                c.percentage((value) => value === 1, precision);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-percentage-fractional-precision"
            expect([1.5, -1.5, 2.9, -0, 0.5].map(percentage)).toEqual([
                66.7, 70, 66.67, 67, 67,
            ]);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-percentage-precision-bounds"
            expect([-(2 ** 63), 2 ** 63 - 1024].map(percentage)).toEqual([
                0, 66.66666666666666,
            ]);
        });

        it("throws PHP's TypeError for a NAN, infinite or out-of-range precision, even with no items", () => {
            const refused = new TypeError(
                "Collection::percentage(): Argument #2 ($precision) must be of type int, float given",
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-percentage-non-int-precision", whose
            // class the port names without PHP's namespace
            for (const precision of [
                NaN,
                Infinity,
                -Infinity,
                1e19,
                -1e19,
                2 ** 63,
            ]) {
                expect(() =>
                    collect([1, 1, 2]).percentage(
                        (value) => value === 1,
                        precision,
                    ),
                ).toThrow(refused);
            }
            expect(() =>
                collect([]).percentage((value) => value === 1, NaN),
            ).toThrow(refused);
        });
    });

    describe("sum", () => {
        describe("Laravel Tests", () => {
            it("test getting sum from collection", () => {
                // CollectionTest::testGettingSumFromCollection
                const c = collect([{ foo: 50 }, { foo: 50 }]);
                expect(c.sum("foo")).toBe(100);

                const d = collect([{ foo: 50 }, { foo: 50 }]);
                expect(
                    d.sum((item) => {
                        return item.foo;
                    }),
                ).toBe(100);
            });

            it("test can sum values without a callback", () => {
                // CollectionTest::testCanSumValuesWithoutACallback
                const c = collect([1, 2, 3, 4, 5]);
                expect(c.sum()).toBe(15);
            });

            it("test getting sum from empty collection", () => {
                // CollectionTest::testGettingSumFromEmptyCollection
                const c = collect();
                expect(c.sum("foo")).toBe(0);
            });
        });

        it("reads a dot path through each item", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-sum-dot-path"
            expect(collect([{ a: { b: 1 } }, { a: { b: 2 } }]).sum("a.b")).toBe(
                3,
            );
        });

        it("adds numeric strings as numbers, as PHP's + does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-sum-numeric-strings",
            // "C32-H-sum-float-strings" and "C32-H-sum-key-numeric-strings"
            expect([
                collect(["1", "2", "3"]).sum(),
                collect(["1.5", "2"]).sum(),
                collect([{ foo: "4" }, { foo: "2" }]).sum("foo"),
            ]).toEqual([6, 3.5, 6]);
        });

        it("adds the number a string leads with, as PHP's + does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-sum-leading-numeric-string"
            expect(collect([1, "2abc"]).sum()).toBe(3);
        });

        it("adds null as nothing and a boolean as 0 or 1, as PHP's + does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-sum-null-and-bools"
            expect([
                collect([1, null, 2]).sum(),
                collect([true, true, false]).sum(),
            ]).toEqual([3, 2]);
        });

        it("throws PHP's TypeError for a value its + cannot add", () => {
            class stdClass {}

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-sum-non-numeric-string"
            expect(() => collect([1, "a"]).sum()).toThrow(
                new TypeError("Unsupported operand types: int + string"),
            );
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-sum-array-items"
            expect(() => collect([[1], [2]]).sum()).toThrow(
                new TypeError("Unsupported operand types: int + array"),
            );
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-sum-object-item"
            expect(() => collect([new stdClass()]).sum()).toThrow(
                new TypeError("Unsupported operand types: int + stdClass"),
            );
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-sum-float-total-non-numeric-string"
            expect(() => collect([1.5, "a"]).sum()).toThrow(
                new TypeError("Unsupported operand types: float + string"),
            );
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-sum-closure-item"
            expect(() => collect([1, () => 1]).sum()).toThrow(
                new TypeError("Unsupported operand types: int + Closure"),
            );
        });

        it("reads undefined as PHP's null, which adds nothing", () => {
            // JS-only: undefined stands for a value PHP does not have, and is read as its null
            expect(collect([1, undefined, 2]).sum()).toBe(3);
        });
    });

    describe("whenEmpty", () => {
        describe("Laravel Tests", () => {
            it("test when empty", () => {
                // CollectionTest::testWhenEmpty
                const data = collect(["michael", "tom"]);

                const result = data.whenEmpty(() => {
                    throw new Error(
                        "whenEmpty() should not trigger on a collection with items",
                    );
                });

                expect(result.all()).toEqual(["michael", "tom"]);

                let emptyData = collect();

                emptyData = emptyData.whenEmpty((col) => {
                    return col.concat(["adam"]);
                });

                expect(emptyData.all()).toEqual(["adam"]);
            });

            it("test when empty default", () => {
                // CollectionTest::testWhenEmptyDefault
                const data = collect(["michael", "tom"]);

                const result = data.whenEmpty(
                    (col) => {
                        return col.concat(["adam"]);
                    },
                    (col) => {
                        return col.concat(["taylor"]);
                    },
                );

                expect(result.all()).toEqual(["michael", "tom", "taylor"]);
            });
        });

        it("hands the callback true as the condition, and answers what it returns", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-whenEmpty-callback-receives-true" and
            // "C32-H-whenEmpty-scalar-return"
            expect([
                collect().whenEmpty((_collection, empty) =>
                    JSON.stringify(empty),
                ),
                collect().whenEmpty(() => "scalar"),
            ]).toEqual(["true", "scalar"]);
        });
    });

    describe("whenNotEmpty", () => {
        describe("Laravel Tests", () => {
            it("test when not empty", () => {
                // CollectionTest::testWhenNotEmpty
                const data = collect(["michael", "tom"]);

                const result = data.whenNotEmpty((col) => {
                    return col.concat(["adam"]);
                });

                expect(result.all()).toEqual(["michael", "tom", "adam"]);

                let emptyData = collect();

                emptyData = emptyData.whenNotEmpty((col) => {
                    return col.concat(["adam"]);
                });

                expect(emptyData.all()).toEqual([]);
            });

            it("test when not empty default", () => {
                // CollectionTest::testWhenNotEmptyDefault
                const data = collect(["michael", "tom"]);

                const result = data.whenNotEmpty(
                    (col) => {
                        return col.concat(["adam"]);
                    },
                    (col) => {
                        return col.concat(["taylor"]);
                    },
                );

                expect(result.all()).toEqual(["michael", "tom", "adam"]);
            });
        });

        it("hands the default false as the condition", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-whenNotEmpty-default-receives-false"
            expect(
                collect().whenNotEmpty(
                    () => "cb",
                    (_collection, notEmpty) => JSON.stringify(notEmpty),
                ),
            ).toBe("false");
        });
    });

    describe("unless", () => {
        it("calls callback when value is falsy", () => {
            // CollectionTest::testUnless, its falsy condition
            const data = collect([1, 2, 3]);

            const result = data.unless(false, (col) => {
                return col.map((x) => x * 2);
            });

            expect(result.all()).toEqual([2, 4, 6]);
        });

        it("returns self when value is truthy and no defaultCallback", () => {
            // CollectionTest::testUnless, its truthy condition
            const data = collect([1, 2, 3]);

            const result = data.unless(true, (col) => {
                return col.map((x) => x * 2);
            });

            expect(result.all()).toEqual([1, 2, 3]);
        });

        it("calls defaultCallback when value is truthy", () => {
            // CollectionTest::testUnlessDefault
            const data = collect([1, 2, 3]);

            const result = data.unless(
                true, // truthy value
                (col) => col.map((x) => x * 2), // callback (not called)
                (col) => col.map((x) => x + 10), // defaultCallback (called)
            );

            expect(result.all()).toEqual([11, 12, 13]);
        });

        it("resolves value from function", () => {
            const data = collect([1, 2, 3]);

            const result = data.unless(
                () => false,
                (col) => col.map((x) => x * 2),
            );

            expect(result.all()).toEqual([2, 4, 6]);
        });

        it("throws PHP's error for a null callback on the branch it takes", () => {
            const c = collect([1, 2, 3]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-unless-null-callback-throws"
            expect(() => Reflect.apply(c.unless, c, [false, null])).toThrow(
                new Error("Value of type null is not callable"),
            );
        });

        it("keeps the collection when the branch with a null callback is not taken", () => {
            const c = collect([1]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-when-unless-null-callback-untaken"
            expect(Reflect.apply(c.unless, c, [true, null])).toBe(c);
        });

        it("returns self when defaultCallback returns null", () => {
            const c = collect([1, 2, 3]);
            const result = c.unless(
                true,
                (col) => col.map((x) => x * 2),
                () => null, // defaultCallback returns null, should fall back to this
            );
            expect(result.all()).toEqual([1, 2, 3]);
        });

        it("returns self when callback returns null", () => {
            const c = collect([1, 2, 3]);
            // callback returns null, so ?? this should be triggered
            const result = c.unless(false, () => null);
            expect(result.all()).toEqual([1, 2, 3]);
        });

        it("returns self when callback returns undefined", () => {
            const c = collect([1, 2, 3]);
            // JS-only: undefined stands for the null that PHP's ?? $this replaces
            const result = c.unless(false, () => undefined);
            expect(result.all()).toEqual([1, 2, 3]);
        });

        it('calls the callback for a "0" or [] condition', () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-unless-php-falsy-values"
            expect([
                collect([1]).unless("0", () => "called"),
                collect([1]).unless([], () => "called"),
            ]).toEqual(["called", "called"]);
        });
    });

    describe("unlessEmpty", () => {
        describe("Laravel Tests", () => {
            it("test unless empty", () => {
                // CollectionTest::testUnlessEmpty
                const data = collect(["michael", "tom"]);

                const result = data.unlessEmpty((col) => {
                    return col.concat(["adam"]);
                });

                expect(result.all()).toEqual(["michael", "tom", "adam"]);

                const emptyData = collect();

                const result2 = emptyData.unlessEmpty((col) => {
                    return col.concat(["adam"]);
                });

                expect(result2.all()).toEqual([]);
            });

            it("test unless empty default", () => {
                // CollectionTest::testUnlessEmptyDefault
                const data = collect(["michael", "tom"]);

                const result = data.unlessEmpty(
                    (col) => {
                        return col.concat(["adam"]);
                    },
                    (col) => {
                        return col.concat(["taylor"]);
                    },
                );

                expect(result.all()).toEqual(["michael", "tom", "adam"]);
            });
        });
    });

    describe("unlessNotEmpty", () => {
        describe("Laravel Tests", () => {
            it("test unless not empty", () => {
                // CollectionTest::testUnlessNotEmpty
                const data = collect(["michael", "tom"]);

                const result = data.unlessNotEmpty(() => {
                    return data.concat(["adam"]);
                });

                expect(result.all()).toEqual(["michael", "tom"]);

                const emptyData = collect();

                const result2 = emptyData.unlessNotEmpty(() => {
                    return emptyData.concat(["adam"]);
                });

                expect(result2.all()).toEqual(["adam"]);
            });

            it("test unless not empty default", () => {
                // CollectionTest::testUnlessNotEmptyDefault
                const data = collect(["michael", "tom"]);

                const result = data.unlessNotEmpty(
                    (col) => {
                        return col.concat(["adam"]);
                    },
                    (col) => {
                        return col.concat(["taylor"]);
                    },
                );

                expect(result.all()).toEqual(["michael", "tom", "taylor"]);
            });
        });
    });

    describe("where", () => {
        describe("Laravel Tests", () => {
            it("test where", () => {
                // CollectionTest::testWhere
                const c = collect([
                    { v: 1 },
                    { v: 2 },
                    { v: 3 },
                    { v: "3" },
                    { v: 4 },
                ]);

                expect(c.where("v", 3).values().all()).toEqual([
                    { v: 3 },
                    { v: "3" },
                ]);
                expect(c.where("v", "=", 3).values().all()).toEqual([
                    { v: 3 },
                    { v: "3" },
                ]);
                expect(c.where("v", "==", 3).values().all()).toEqual([
                    { v: 3 },
                    { v: "3" },
                ]);
                expect(c.where("v", "garbage", 3).values().all()).toEqual([
                    { v: 3 },
                    { v: "3" },
                ]);
                expect(c.where("v", "===", 3).values().all()).toEqual([
                    { v: 3 },
                ]);

                expect(c.where("v", "<>", 3).values().all()).toEqual([
                    { v: 1 },
                    { v: 2 },
                    { v: 4 },
                ]);
                expect(c.where("v", "!=", 3).values().all()).toEqual([
                    { v: 1 },
                    { v: 2 },
                    { v: 4 },
                ]);
                expect(c.where("v", "!==", 3).values().all()).toEqual([
                    { v: 1 },
                    { v: 2 },
                    { v: "3" },
                    { v: 4 },
                ]);
                expect(c.where("v", "<=", 3).values().all()).toEqual([
                    { v: 1 },
                    { v: 2 },
                    { v: 3 },
                    { v: "3" },
                ]);
                expect(c.where("v", ">=", 3).values().all()).toEqual([
                    { v: 3 },
                    { v: "3" },
                    { v: 4 },
                ]);
                expect(c.where("v", "<", 3).values().all()).toEqual([
                    { v: 1 },
                    { v: 2 },
                ]);
                expect(c.where("v", ">", 3).values().all()).toEqual([{ v: 4 }]);

                // A class instance stands in for PHP's (object) cast, where a plain object would model an array
                class StdObject {
                    foo = "bar";
                }

                const object = new StdObject();

                expect(c.where("v", object).values().all()).toEqual([]);

                expect(c.where("v", "<>", object).values().all()).toEqual([
                    { v: 1 },
                    { v: 2 },
                    { v: 3 },
                    { v: "3" },
                    { v: 4 },
                ]);

                expect(c.where("v", "!=", object).values().all()).toEqual([
                    { v: 1 },
                    { v: 2 },
                    { v: 3 },
                    { v: "3" },
                    { v: 4 },
                ]);

                expect(c.where("v", "!==", object).values().all()).toEqual([
                    { v: 1 },
                    { v: 2 },
                    { v: 3 },
                    { v: "3" },
                    { v: 4 },
                ]);

                expect(c.where("v", ">", object).values().all()).toEqual([]);

                expect(
                    c
                        .where((value) => value.v == 3)
                        .values()
                        .all(),
                ).toEqual([{ v: 3 }, { v: "3" }]);

                expect(
                    c
                        .where((value) => value.v === 3)
                        .values()
                        .all(),
                ).toEqual([{ v: 3 }]);

                const c2 = collect([{ v: 1 }, { v: object }]);

                expect(c2.where("v", object).values().all()).toEqual([
                    { v: object },
                ]);

                expect(c2.where("v", "<>", null).values().all()).toEqual([
                    { v: 1 },
                    { v: object },
                ]);

                expect(c2.where("v", "<", null).values().all()).toEqual([]);

                class HtmlString {
                    private value: string;
                    constructor(value: string) {
                        this.value = value;
                    }
                    toString() {
                        return this.value;
                    }
                }

                const c3 = collect([{ v: 1 }, { v: new HtmlString("hello") }]);

                expect(c3.where("v", "hello").values().all()).toEqual([
                    { v: new HtmlString("hello") },
                ]);

                const c4 = collect([{ v: 1 }, { v: "hello" }]);

                expect(
                    c4.where("v", new HtmlString("hello")).values().all(),
                ).toEqual([{ v: "hello" }]);

                const c5 = collect([{ v: 1 }, { v: 2 }, { v: null }]);

                expect(c5.where("v").values().all()).toEqual([
                    { v: 1 },
                    { v: 2 },
                ]);

                const c6 = collect([
                    { v: 1, g: 3 },
                    { v: 2, g: 2 },
                    { v: 2, g: 3 },
                    { v: 2, g: null },
                ]);

                expect(c6.where("v", 2).where("g", 3).values().all()).toEqual([
                    { v: 2, g: 3 },
                ]);

                expect(
                    c6.where("v", 2).where("g", ">", 2).values().all(),
                ).toEqual([{ v: 2, g: 3 }]);

                expect(c6.where("v", 2).where("g", 4).values().all()).toEqual(
                    [],
                );

                expect(c6.where("v", 2).whereNull("g").values().all()).toEqual([
                    { v: 2, g: null },
                ]);
            });
        });

        it("reads an explicit undefined second argument as PHP's null", () => {
            const rows = collect([{ a: 1 }, { b: 2 }]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-where-missing-key-null"
            expect(rows.where("missing", null).keys().all()).toEqual([0, 1]);
            // JS-only: an explicit undefined stands for PHP's null, so it counts as a second argument
            expect(rows.where("missing", undefined).keys().all()).toEqual([
                0, 1,
            ]);
        });

        it("keeps no item whose value is an object when given only a key", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-where-one-arg-empty-object": Laravel
            // answers "=" false for a lone object before comparing, so no truthiness is judged
            expect(
                collect([{ v: new Date(0) }, { v: new (class {})() }])
                    .where("v")
                    .count(),
            ).toBe(0);
        });

        it("judges a lone key's value by PHP truthiness", () => {
            const kept = collect([
                { v: 1 },
                { v: "a" },
                { v: 0 },
                { v: "0" },
                { v: "" },
                { v: null },
                { v: [] },
                { v: true },
                { v: false },
            ]).where("v");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-where-one-arg-truthiness", whose
            // keys [0, 1, 7] name these rows; a list renumbers them, as every removal from a list does
            expect(kept.pluck("v").all()).toEqual([1, "a", true]);
        });

        it("compares the item itself for a null key", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-where-null-key-items", whose keys 2
            // and 3 name these items; a list renumbers them, as every removal from a list does
            expect(collect([1, 2, 3, 4]).where(null, ">", 2).all()).toEqual([
                3, 4,
            ]);
        });

        it("compares with null loosely, as PHP's = does", () => {
            const kept = collect([
                { v: 0 },
                { v: "" },
                { v: false },
                { v: null },
                { v: "0" },
                { v: [] },
                { v: "a" },
            ]).where("v", "=", null);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-where-eq-null-loose", whose keys
            // [0, 1, 2, 3, 5] name these rows; a list renumbers them, as every removal from a list does
            expect(kept.pluck("v").all()).toEqual([0, "", false, null, []]);
        });
    });

    describe("whereNull", () => {
        describe("Laravel Tests", () => {
            it("test where null", () => {
                // CollectionTest::testWhereNull
                const data = collect([
                    { name: "Taylor" },
                    { name: null },
                    { name: "Bert" },
                    { name: false },
                    { name: "" },
                ]);

                expect(data.whereNull("name").all()).toEqual([{ name: null }]);

                expect(data.whereNull().all()).toEqual([]);
            });

            it("test where null without key", () => {
                // CollectionTest::testWhereNullWithoutKey
                const collection = collect([1, null, 3, "null", false, true]);

                expect(collection.whereNull().all()).toEqual([null]);
            });
        });

        it("keeps a keyed collection's null items under their keys", () => {
            const kept = collect({ a: null, b: 0, c: null }).whereNull();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereNull-keyed"
            expect(kept.all()).toEqual({ a: null, c: null });
            expect(kept.keys().all()).toEqual(["a", "c"]);
            expect(kept.values().all()).toEqual([null, null]);
        });
    });

    describe("whereNotNull", () => {
        describe("Laravel Tests", () => {
            it("test where not null", () => {
                // CollectionTest::testWhereNotNull
                const originalData = [
                    { name: "Taylor" },
                    { name: null },
                    { name: "Bert" },
                    { name: false },
                    { name: "" },
                ];
                const data = collect(originalData);

                expect(data.whereNotNull("name").all()).toEqual([
                    { name: "Taylor" },
                    { name: "Bert" },
                    { name: false },
                    { name: "" },
                ]);

                expect(data.whereNotNull().all()).toEqual(originalData);
            });

            it("test where not null without key", () => {
                // CollectionTest::testWhereNotNullWithoutKey
                const data = collect([1, null, 3, "null", false, true]);

                expect(data.whereNotNull().all()).toEqual([
                    1,
                    3,
                    "null",
                    false,
                    true,
                ]);
            });
        });

        it("reads a dot path's value", () => {
            const kept = collect([
                { a: { b: null } },
                { a: { b: 0 } },
                { a: {} },
            ]).whereNotNull("a.b");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereNotNull-dot-path", whose key 1
            // names this row; a list renumbers it, as every removal from a list does
            expect(kept.all()).toEqual([{ a: { b: 0 } }]);
        });
    });

    describe("whereStrict", () => {
        describe("Laravel Tests", () => {
            it("test where strict", () => {
                // CollectionTest::testWhereStrict
                const c = collect([{ v: 3 }, { v: "3" }]);

                expect(c.whereStrict("v", 3).values().all()).toEqual([
                    { v: 3 },
                ]);
            });
        });

        it("compares an array by value, as PHP's === does", () => {
            const kept = collect([
                { v: [1, 2] },
                { v: ["1", "2"] },
                { v: [2, 1] },
            ]).whereStrict("v", [1, 2]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-where-strict-array-by-value"
            expect(kept.all()).toEqual([{ v: [1, 2] }]);
        });
    });

    describe("whereIn", () => {
        describe("Laravel Tests", () => {
            it("test where in", () => {
                // CollectionTest::testWhereIn
                const c = collect([
                    { v: 1 },
                    { v: 2 },
                    { v: 3 },
                    { v: "3" },
                    { v: 4 },
                ]);

                expect(c.whereIn("v", [1, 3]).values().all()).toEqual([
                    { v: 1 },
                    { v: 3 },
                    { v: "3" },
                ]);

                expect(
                    c.whereIn("v", [2]).whereIn("v", [1, 3]).values().all(),
                ).toEqual([]);

                expect(
                    c.whereIn("v", [1]).whereIn("v", [1, 3]).values().all(),
                ).toEqual([{ v: 1 }]);
            });
        });

        it.each([
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereIn-null-loose"
                "null",
                [0, "", false, null, "0", "a", []],
                [null],
                [0, "", false, null, []],
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereIn-numeric-string-loose"
                '"1e1"',
                [10, "10", "1e1", "010", "x"],
                ["1e1"],
                [10, "10", "1e1", "010"],
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereIn-true-loose"
                "true",
                ["x", 1, 0, "", null, "0", [1]],
                [true],
                ["x", 1, [1]],
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereIn-array-loose"
                "[1, 2]",
                [
                    [1, 2],
                    ["1", "2"],
                    [2, 1],
                ],
                [[1, 2]],
                [
                    [1, 2],
                    ["1", "2"],
                ],
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereIn-numbers-and-strings-loose"
                "numbers, numeric strings and plain strings",
                [
                    1,
                    "1",
                    "1.0",
                    2,
                    "02",
                    3,
                    "3",
                    4,
                    "ABC",
                    "abc",
                    0.5,
                    ".5",
                    "5",
                ],
                [1, "2", " 3", "4 ", "abc", "0.5"],
                [1, "1", "1.0", 2, "02", 3, "3", 4, "abc", 0.5, ".5"],
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json,
                // "C32-D-whereIn-integer-strings-past-2-53-loose"
                "an integer string past 2^53",
                [
                    9007199254740992,
                    "9007199254740993",
                    "9007199254740993.0",
                    "9007199254740992",
                ],
                ["9007199254740993"],
                ["9007199254740993", "9007199254740993.0"],
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereIn-inf-loose"
                '"INF" and "1e999"',
                [Infinity, "INF", "1e999", "1e1000", "inf"],
                ["INF", "1e999"],
                [Infinity, "INF", "1e999"],
            ],
        ] as [string, unknown[], unknown[], unknown[]][])(
            "keeps the items PHP's in_array finds loosely equal to %s",
            (_label, values, set, kept) => {
                const filtered = collect(values.map((v) => ({ v }))).whereIn(
                    "v",
                    set,
                );

                // The row's keys name the kept items; a list renumbers them, as every removal from a list does
                expect(filtered.pluck("v").all()).toEqual(kept);
                expect(filtered.keys().all()).toEqual(kept.map((_, i) => i));
            },
        );

        it("takes a keyed Collection's values", () => {
            const filtered = collect([1, 2, 3, 4].map((v) => ({ v }))).whereIn(
                "v",
                collect({ a: 1, b: 3 }),
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereIn-collection-values", whose
            // keys 0 and 2 name these rows; a list renumbers them, as every removal from a list does
            expect(filtered.pluck("v").all()).toEqual([1, 3]);
        });
    });

    describe("whereInStrict", () => {
        describe("Laravel Tests", () => {
            it("test where in strict", () => {
                // CollectionTest::testWhereInStrict
                const c = collect([
                    { v: 1 },
                    { v: 2 },
                    { v: 3 },
                    { v: "3" },
                    { v: 4 },
                ]);

                expect(c.whereInStrict("v", [1, 3]).values().all()).toEqual([
                    { v: 1 },
                    { v: 3 },
                ]);
            });
        });

        it("compares an array by value, as PHP's === does", () => {
            const filtered = collect([
                { v: [1, 2] },
                { v: ["1", "2"] },
            ]).whereInStrict("v", [[1, 2]]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereInStrict-array"
            expect(filtered.all()).toEqual([{ v: [1, 2] }]);
            expect(filtered.keys().all()).toEqual([0]);
        });

        it("compares scalars by type and value, as PHP's === does, so NAN matches nothing", () => {
            const filtered = collect(
                [1, "1", 2, "2", null, false, NaN].map((v) => ({ v })),
            ).whereInStrict("v", [1, "2", null, NaN]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereInStrict-scalars", whose keys
            // 0, 3 and 4 name these rows; a list renumbers them, as every removal from a list does
            expect(filtered.pluck("v").all()).toEqual([1, "2", null]);
            expect(filtered.keys().all()).toEqual([0, 1, 2]);
        });
    });

    describe("whereBetween", () => {
        describe("Laravel Tests", () => {
            it("test where between", () => {
                // CollectionTest::testBetween
                const c = collect([
                    { v: 1 },
                    { v: 2 },
                    { v: 3 },
                    { v: "3" },
                    { v: 4 },
                ]);

                expect(c.whereBetween("v", [2, 4]).values().all()).toEqual([
                    { v: 2 },
                    { v: 3 },
                    { v: "3" },
                    { v: 4 },
                ]);

                expect(c.whereBetween("v", [-1, 1]).values().all()).toEqual([
                    { v: 1 },
                ]);

                expect(c.whereBetween("v", [3, 3]).values().all()).toEqual([
                    { v: 3 },
                    { v: "3" },
                ]);
            });
        });

        it("takes the first and the last of the values as the bounds", () => {
            const rows = (values: unknown[]) =>
                collect(values.map((v) => ({ v })));

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereBetween-three-values", whose
            // keys [1, 2, 3] name these rows; a list renumbers them, as every removal from a list does
            expect(
                rows([0, 1, 2, 3, 4, 5, 6])
                    .whereBetween("v", [1, 5, 3])
                    .pluck("v")
                    .all(),
            ).toEqual([1, 2, 3]);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereBetween-keyed-values"
            expect(
                rows([0, 1, 2, 3, 4])
                    .whereBetween("v", { max: 3, min: 1 })
                    .all(),
            ).toEqual([]);
        });

        it("compares null and false as PHP's >= and <= do", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereBetween-null-item", whose keys
            // [0, 1, 2, 4] name these rows; a list renumbers them, as every removal from a list does
            expect(
                collect([null, 0, 1, "", false].map((v) => ({ v })))
                    .whereBetween("v", [0, 2])
                    .pluck("v")
                    .all(),
            ).toEqual([null, 0, 1, false]);
        });

        it("takes a Collection's values as the bounds", () => {
            // JS-only: PHP 8.5 deprecates reset() and end() on an object, so its call keeps no item
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereBetween-collection-values"
            expect(
                collect([0, 1, 2, 3, 4].map((v) => ({ v })))
                    .whereBetween("v", collect([1, 3]))
                    .pluck("v")
                    .all(),
            ).toEqual([1, 2, 3]);
        });
    });

    describe("whereNotBetween", () => {
        describe("Laravel Tests", () => {
            it("test where not between", () => {
                // CollectionTest::testWhereNotBetween
                const c = collect([
                    { v: 1 },
                    { v: 2 },
                    { v: 3 },
                    { v: "3" },
                    { v: 4 },
                ]);

                expect(c.whereNotBetween("v", [2, 4]).values().all()).toEqual([
                    { v: 1 },
                ]);

                expect(c.whereNotBetween("v", [-1, 1]).values().all()).toEqual([
                    { v: 2 },
                    { v: 3 },
                    { v: "3" },
                    { v: 4 },
                ]);

                expect(c.whereNotBetween("v", [3, 3]).values().all()).toEqual([
                    { v: 1 },
                    { v: 2 },
                    { v: 4 },
                ]);
            });
        });

        const mixed = [
            { v: "9" },
            { v: "10" },
            { v: "1" },
            { v: 5 },
            { v: null },
            { v: 0 },
        ];

        // task-19-spaceship.json, "whereNotBetween over numeric strings and
        // falsy values" - a non-sort consumer of compareValues, which used to
        // drop "10" because "10" <= "5" lexically.
        it("excludes numeric strings by value, not lexically", () => {
            expect(
                collect(mixed)
                    .whereNotBetween("v", ["1", "5"])
                    .pluck("v")
                    .all(),
            ).toEqual(["9", "10", null, 0]);
        });

        // task-19-spaceship.json, "whereBetween over the same items" - whereBetween
        // filters through `where(key, ">=", ...)`, which operatorMatch now orders with
        // compareValues too, so the pair finally agrees with PHP and with each other.
        it("agrees with whereBetween, which now shares the comparator", () => {
            expect(
                collect(mixed).whereBetween("v", ["1", "5"]).pluck("v").all(),
            ).toEqual(["1", 5]);
        });

        it("takes a Collection's values as the bounds", () => {
            // JS-only: PHP 8.5 deprecates reset() and end() on an object, so its call keeps every item
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereNotBetween-collection-values"
            expect(
                collect([0, 1, 2, 3, 4].map((v) => ({ v })))
                    .whereNotBetween("v", collect([1, 3]))
                    .pluck("v")
                    .all(),
            ).toEqual([0, 4]);
        });
    });

    describe("whereNotIn", () => {
        describe("Laravel Tests", () => {
            it("test where not in", () => {
                // CollectionTest::testWhereNotIn
                const c = collect([
                    { v: 1 },
                    { v: 2 },
                    { v: 3 },
                    { v: "3" },
                    { v: 4 },
                ]);

                expect(c.whereNotIn("v", [1, 3]).values().all()).toEqual([
                    { v: 2 },
                    { v: 4 },
                ]);

                expect(
                    c
                        .whereNotIn("v", [2])
                        .whereNotIn("v", [1, 3])
                        .values()
                        .all(),
                ).toEqual([{ v: 4 }]);
            });
        });

        it.each([
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereNotIn-null-loose"
                "null",
                [0, "", false, null, "0", "a", []],
                [null],
                ["0", "a"],
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereNotIn-true-loose"
                "true",
                ["x", 1, 0, "", null, "0", [1]],
                [true],
                [0, "", null, "0"],
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json,
                // "C32-D-whereNotIn-numbers-and-strings-loose"
                "a number and a plain string",
                [1, "1", "abc", "ABC", 2, true],
                [1, "abc"],
                ["ABC", 2],
            ],
        ] as [string, unknown[], unknown[], unknown[]][])(
            "drops the items PHP's in_array finds loosely equal to %s",
            (_label, values, set, kept) => {
                const filtered = collect(values.map((v) => ({ v }))).whereNotIn(
                    "v",
                    set,
                );

                // The row's keys name the kept items; a list renumbers them, as every removal from a list does
                expect(filtered.pluck("v").all()).toEqual(kept);
                expect(filtered.keys().all()).toEqual(kept.map((_, i) => i));
            },
        );
    });

    describe("whereNotInStrict", () => {
        describe("Laravel Tests", () => {
            it("test where not in strict", () => {
                // CollectionTest::testWhereNotInStrict
                const c = collect([
                    { v: 1 },
                    { v: 2 },
                    { v: 3 },
                    { v: "3" },
                    { v: 4 },
                ]);

                expect(c.whereNotInStrict("v", [1, 3]).values().all()).toEqual([
                    { v: 2 },
                    { v: "3" },
                    { v: 4 },
                ]);
            });
        });

        it("compares an array by value, as PHP's === does", () => {
            const filtered = collect([
                { v: [1, 2] },
                { v: ["1", "2"] },
            ]).whereNotInStrict("v", [[1, 2]]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereNotInStrict-array", whose key 1
            // names this row; a list renumbers it, as every removal from a list does
            expect(filtered.all()).toEqual([{ v: ["1", "2"] }]);
            expect(filtered.keys().all()).toEqual([0]);
        });
    });

    describe("whereInstanceOf", () => {
        describe("Laravel Tests", () => {
            it("test where instance of", () => {
                // CollectionTest::testWhereInstanceOf, whose stdClass and Str these two classes stand in for
                class StdClass {}
                class Str {}

                const c = collect([
                    new StdClass(),
                    new StdClass(),
                    collect(),
                    new StdClass(),
                    new Str(),
                ]);

                expect(c.whereInstanceOf(StdClass).count()).toBe(3);
                expect(c.whereInstanceOf([StdClass, Str]).count()).toBe(4);
            });
        });

        it("keeps every object for Object, which no PHP class matches", () => {
            const c = collect([
                {},
                {},
                collect([]),
                {},
                new Stringable("example"),
            ]);

            // JS-only: every JS object, a plain one included, is an instance of Object
            expect(c.whereInstanceOf(Object).count()).toBe(5);
            expect(c.whereInstanceOf([Collection]).count()).toBe(1);
            expect(c.whereInstanceOf([Stringable]).count()).toBe(1);
        });

        it("handles array of types", () => {
            class A {}
            class B {}
            class C {}
            const c = collect([new A(), new B(), new C()]);
            const result = c.whereInstanceOf([A, B]);
            expect(result.count()).toBe(2);
        });

        it("handles object of types", () => {
            class StdClass {}
            class ArrayObject {}
            class SplStack {}
            const kept = collect([
                new StdClass(),
                new ArrayObject(),
                new SplStack(),
            ]).whereInstanceOf({ a: StdClass, b: SplStack });

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereInstanceOf-assoc-types", whose
            // keys 0 and 2 name these items; a list renumbers them, as every removal from a list does
            expect(kept.count()).toBe(2);
            expect(kept.first()).toBeInstanceOf(StdClass);
            expect(kept.last()).toBeInstanceOf(SplStack);
        });
    });

    describe("pipe", () => {
        describe("Laravel Tests", () => {
            it("test pipe", () => {
                // CollectionTest::testPipe
                const data = collect([1, 2, 3]);

                expect(
                    data.pipe((data) => {
                        return data.sum();
                    }),
                ).toBe(6);
            });
        });
    });

    describe("pipeInto", () => {
        describe("Laravel Tests", () => {
            it("test pipe into", () => {
                // CollectionTest::testPipeInto
                const data = collect(["first", "second"]);

                class TestCollectionMapIntoObject {
                    value: Collection<string, number>;
                    constructor(value: Collection<string, number>) {
                        this.value = value;
                    }
                }

                const instance = data.pipeInto(TestCollectionMapIntoObject);

                expect(instance.value).toBe(data);
            });
        });
    });

    describe("pipeThrough", () => {
        describe("Laravel Tests", () => {
            it("test pipe through", () => {
                // CollectionTest::testPipeThrough
                const data = collect([1, 2, 3]);

                const result = data.pipeThrough([
                    (data) => {
                        return data.merge([4, 5]);
                    },
                    (data) => {
                        return data.sum();
                    },
                ]);

                expect(result).toBe(15);
            });
        });

        it("hands each callback what the one before it returned", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-pipeThrough-order"
            expect(
                collect(["a"]).pipeThrough([
                    (data) => data.push("b"),
                    (data) => data.implode(""),
                    (value) => String(value).toUpperCase(),
                ]),
            ).toBe("AB");
        });

        it("answers the collection itself for no callbacks", () => {
            const c = collect([1]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-pipeThrough-empty-returns-receiver"
            expect(c.pipeThrough([])).toBe(c);
        });
    });

    describe("reduce", () => {
        it("hands the callback PHP's key, so a non-canonical one stays a string", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "chunkBy-noncanonical-key-type":
            // PHP keeps "01" a string key; only a canonical integer string is stored as an int.
            const seen: PropertyKey[] = [];

            collect({ "01": "a", "10": "b", x: "c" }).reduce<null>(
                (carry, _value, key) => {
                    seen.push(key);

                    return carry;
                },
                null,
            );

            expect(seen).toEqual([10, "01", "x"]);
        });

        describe("Laravel Tests", () => {
            it("test reduce", () => {
                // CollectionTest::testReduce
                const data = collect([1, 2, 3]);

                expect(
                    data.reduce((carry, element) => {
                        return carry + element;
                    }),
                ).toBe(6);

                expect(
                    data.reduce((carry, element, key) => {
                        return carry + element + key;
                    }),
                ).toBe(9);

                const data2 = collect({ foo: "bar", baz: "qux" });

                // PHP's .= reads the null carry as "", where JS's + would write "null"
                expect(
                    data2.reduce((carry, element, key) => {
                        return (carry ?? "") + key + element;
                    }),
                ).toBe("foobarbazqux");
            });
        });

        it("seeds the carry with null and hands the callback every item", () => {
            const seen: unknown[] = [];

            collect([10, 20, 30]).reduce((carry, value, key) => {
                seen.push([carry, value, key]);

                return value;
            });

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-reduce-no-initial-trace"
            expect(seen).toEqual([
                [null, 10, 0],
                [10, 20, 1],
                [20, 30, 2],
            ]);
        });

        it("hands a lone item to the callback with a null carry", () => {
            let pair: unknown = "not called";

            collect([5]).reduce((carry, value) => {
                pair = [carry, value];

                return value;
            });

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-reduce-no-initial-single"
            expect(pair).toEqual([null, 5]);
        });

        it("walks a Map-built collection in its insertion order", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-reduce-family-out-of-order"
            expect(
                outOfOrderKeys().reduce(
                    (carry, value, key) => `${carry}${key}${value}`,
                    "",
                ),
            ).toBe("2c0a1b");
        });

        describe("empty collection behaviour", () => {
            it("returns null when reducing an empty collection with no initial value", () => {
                // docs/php-parity/task-24-data-release-readiness.json, "reduce-empty-no-initial"
                expect(
                    collect([] as number[]).reduce(
                        (carry, value) => carry + value,
                    ),
                ).toBeNull();

                expect(
                    collect({} as Record<string, number>).reduce(
                        (carry, value) => carry + value,
                    ),
                ).toBeNull();
            });

            it("returns the initial value when reducing an empty collection with an initial value", () => {
                expect(
                    collect([] as number[]).reduce(
                        (carry, value) => carry + value,
                        0,
                    ),
                ).toBe(0);

                expect(
                    collect([] as string[]).reduce(
                        (carry, value) => carry + value,
                        "start",
                    ),
                ).toBe("start");

                expect(
                    collect([] as number[]).reduce<number | null>(
                        (_carry, value) => value,
                        null,
                    ),
                ).toBeNull();
            });
        });
    });

    describe("reduceInto", () => {
        describe("Laravel Tests", () => {
            it("test reduce into", () => {
                // CollectionTest::testReduceInto
                // JS-only: PHP writes a primitive accumulator through its reference; here the callback returns it
                const data = collect([1, 2, 3]);

                expect(
                    data.reduceInto(0, (result, element) => {
                        return result + element;
                    }),
                ).toBe(6);

                const data2 = collect({ foo: "bar", baz: "qux" });

                expect(
                    data2.reduceInto("", (result, element, key) => {
                        return result + key + element;
                    }),
                ).toBe("foobarbazqux");

                const data3 = collect([1, 2, 3, 4, 5]);

                const result = data3.reduceInto(
                    [] as number[],
                    (result, value) => {
                        if (value % 2 === 0) {
                            result.push(value);
                        }
                    },
                );

                expect(result).toEqual([2, 4]);
            });
        });

        describe("mutating the accumulator in place", () => {
            it("keeps the accumulator when the callback returns undefined", () => {
                // JS-only: PHP ignores what the callback returns; here only undefined leaves the accumulator in place
                const grouped = collect([1, 2, 3, 4]).reduceInto(
                    { even: [] as number[], odd: [] as number[] },
                    (result, value) => {
                        if (value % 2 === 0) {
                            result.even.push(value);
                        } else {
                            result.odd.push(value);
                        }
                    },
                );

                expect(grouped).toEqual({ even: [2, 4], odd: [1, 3] });
            });

            it("returns the initial value for an empty collection", () => {
                expect(
                    collect([] as number[]).reduceInto(0, (result, value) => {
                        return result + value;
                    }),
                ).toBe(0);

                expect(
                    collect({} as Record<string, number>).reduceInto(
                        [] as number[],
                        (result, value) => {
                            result.push(value);
                        },
                    ),
                ).toEqual([]);
            });
        });

        it("walks a Map-built collection in its insertion order", () => {
            const pieces = outOfOrderKeys().reduceInto(
                [] as string[],
                (result, value, key) => {
                    result.push(`${key}${value}`);
                },
            );

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-reduce-family-out-of-order"
            expect(pieces.join("")).toBe("2c0a1b");
        });
    });

    describe("reduceSpread", () => {
        describe("Laravel Tests", () => {
            it("test reduce spread", () => {
                // CollectionTest::testReduceSpread, whose PHP_INT_MIN and PHP_INT_MAX the safe integers stand in for
                const data = collect([-1, 0, 1, 2, 3, 4, 5]);

                const [sum, max, min] = data.reduceSpread(
                    (sum, max, min, value) => {
                        sum += value;
                        max = Math.max(max, value);
                        min = Math.min(min, value);

                        return [sum, max, min];
                    },
                    0,
                    Number.MIN_SAFE_INTEGER,
                    Number.MAX_SAFE_INTEGER,
                );

                expect(sum).toBe(14);
                expect(max).toBe(5);
                expect(min).toBe(-1);
            });

            it("test reduce spread throws an exception if reducer does not return an array", () => {
                // CollectionTest::testReduceSpreadThrowsAnExceptionIfReducerDoesNotReturnAnArray
                const data = collect([1]);

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-reduceSpread-throws-boolean"
                expect(() =>
                    Reflect.apply(data.reduceSpread, data, [() => false, null]),
                ).toThrow(
                    new UnexpectedValueException(
                        "Collection::reduceSpread expects reducer to return an array, but got a 'boolean' instead.",
                    ),
                );
            });
        });

        it("names the type its reducer returned as PHP's gettype() does", () => {
            const data = collect([1]);
            const returning = (value: unknown) => () =>
                Reflect.apply(data.reduceSpread, data, [() => value, null]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-reduceSpread-throws-integer",
            // "C32-H-reduceSpread-throws-double", "C32-H-reduceSpread-throws-null",
            // "C32-H-reduceSpread-throws-string" and "C32-H-reduceSpread-throws-object"
            expect(returning(5)).toThrow(
                new UnexpectedValueException(
                    "Collection::reduceSpread expects reducer to return an array, but got a 'integer' instead.",
                ),
            );
            expect(returning(1.5)).toThrow(
                new UnexpectedValueException(
                    "Collection::reduceSpread expects reducer to return an array, but got a 'double' instead.",
                ),
            );
            expect(returning(null)).toThrow(
                new UnexpectedValueException(
                    "Collection::reduceSpread expects reducer to return an array, but got a 'NULL' instead.",
                ),
            );
            expect(returning("x")).toThrow(
                new UnexpectedValueException(
                    "Collection::reduceSpread expects reducer to return an array, but got a 'string' instead.",
                ),
            );
            expect(returning(new (class {})())).toThrow(
                new UnexpectedValueException(
                    "Collection::reduceSpread expects reducer to return an array, but got a 'object' instead.",
                ),
            );
        });

        it("names the subclass it was called on in its message, as class_basename(static::class) does", () => {
            // Named as the probe's own subclass, which PHP's message prints
            class C32ASub extends Collection<number, number> {}

            const data = new C32ASub([1]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-reduceSpread-subclass-message"
            expect(() =>
                Reflect.apply(data.reduceSpread, data, [() => false, null]),
            ).toThrow(
                new UnexpectedValueException(
                    "C32ASub::reduceSpread expects reducer to return an array, but got a 'boolean' instead.",
                ),
            );
        });

        it("answers the initial values for an empty collection, without calling the reducer", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-reduceSpread-empty"
            expect(
                collect([]).reduceSpread(
                    () => {
                        throw new Error("called");
                    },
                    1,
                    2,
                ),
            ).toEqual([1, 2]);
        });

        it("walks a Map-built collection in its insertion order", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-reduce-family-out-of-order"
            expect(
                outOfOrderKeys().reduceSpread(
                    (carry, value, key) => [`${carry}${String(key)}${value}`],
                    "",
                ),
            ).toEqual(["2c0a1b"]);
        });
    });

    describe("reduceWithKeys", () => {
        describe("reducing with the keys and an initial value", () => {
            it("test reduce with keys", () => {
                const data = collect({ a: 1, b: 2, c: 3 });

                expect(
                    data.reduceWithKeys((carry, value, key) => {
                        carry += key + value;
                        return carry;
                    }, ""),
                ).toBe("a1b2c3");

                const data2 = collect([
                    { key: "a", value: 1 },
                    { key: "b", value: 2 },
                ]);

                expect(
                    data2.reduceWithKeys(
                        (carry, item) => {
                            carry[item.key] = item.value;

                            return carry;
                        },
                        {} as Record<string, number>,
                    ),
                ).toEqual({ a: 1, b: 2 });
            });
        });

        describe("empty collection and null-default behaviour", () => {
            it("uses null as the initial carry when no initial value is provided", () => {
                // PHP default: $initial = null, so carry starts as null for the first call
                const data = collect([1, 2, 3]);

                expect(
                    data.reduceWithKeys((carry, value) => {
                        return (carry ?? 0) + value;
                    }),
                ).toBe(6);
            });

            it("returns null when reducing an empty collection with no initial value", () => {
                expect(
                    collect([] as number[]).reduceWithKeys(
                        (carry, value) => (carry ?? 0) + value,
                    ),
                ).toBeNull();

                expect(
                    collect({} as Record<string, number>).reduceWithKeys(
                        (carry, value) => (carry ?? 0) + value,
                    ),
                ).toBeNull();
            });
        });
    });

    describe("reject", () => {
        describe("Laravel Tests", () => {
            it("test reject removes elements passing truth test", () => {
                // CollectionTest::testRejectRemovesElementsPassingTruthTest
                const c = collect(["foo", "bar"]);
                expect(c.reject("bar").values().all()).toEqual(["foo"]);

                const d = collect(["foo", "bar"]);
                expect(
                    d
                        .reject((v) => v === "bar")
                        .values()
                        .all(),
                ).toEqual(["foo"]);

                const e = collect(["foo", null]);
                expect(e.reject(null).values().all()).toEqual(["foo"]);

                const f = collect(["foo", "bar"]);
                expect(f.reject("baz").values().all()).toEqual(["foo", "bar"]);

                const g = collect(["foo", "bar"]);
                expect(
                    g
                        .reject((v) => v === "baz")
                        .values()
                        .all(),
                ).toEqual(["foo", "bar"]);

                const h = collect({ id: 1, primary: "foo", secondary: "bar" });
                expect(h.reject((_item, key) => key === "id").all()).toEqual({
                    primary: "foo",
                    secondary: "bar",
                });
            });

            it("test reject without an argument removes truthy values", () => {
                // CollectionTest::testRejectWithoutAnArgumentRemovesTruthyValues
                const data1 = collect([false, true, collect(), 0]);
                expect(data1.reject().values().all()).toEqual([false, 0]);

                const data2 = collect({
                    a: true,
                    b: true,
                    c: true,
                });
                expect(data2.reject().isEmpty()).toBe(true);

                const data3 = collect({
                    a: true,
                    b: true,
                    c: false,
                });
                expect(data3.reject().isEmpty()).toBe(false);
            });
        });

        it("test reject with specific value removes matching elements", () => {
            // Test rejecting elements that match a specific value (not a function, not true)
            const data1 = collect([1, 2, 3, 2, 4]);
            expect(data1.reject(2).values().all()).toEqual([1, 3, 4]);

            const data2 = collect(["foo", "bar", "baz", "bar"]);
            expect(data2.reject("bar").values().all()).toEqual(["foo", "baz"]);

            const data3 = collect([null, "test", null, "value"]);
            expect(data3.reject(null).values().all()).toEqual([
                "test",
                "value",
            ]);

            const data4 = collect([0, 1, 2, 0, 3]);
            expect(data4.reject(0).values().all()).toEqual([1, 2, 3]);

            const data5 = collect([false, true, false, true]);
            expect(data5.reject(false).values().all()).toEqual([true, true]);

            // Test with objects
            const data6 = collect({ a: 1, b: 2, c: 1, d: 3 });
            expect(data6.reject(1).all()).toEqual({ b: 2, d: 3 });

            const data7 = collect({ a: "foo", b: "bar", c: "foo" });
            expect(data7.reject("foo").all()).toEqual({ b: "bar" });
        });

        it("keeps the PHP-falsy items without an argument", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-reject-none-php-falsy"
            expect(
                collect([[], "0", 0.0, "a", "", null, true])
                    .reject()
                    .values()
                    .all(),
            ).toEqual([[], "0", 0, "", null]);
        });

        it("rejects every object without an argument, however empty", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-reject-none-empty-objects"
            expect(
                collect([new Date(0), new (class {})()])
                    .reject()
                    .count(),
            ).toBe(0);
        });

        it.each([
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-reject-false-loose"
                "false",
                [null, 0, "", "a", [], true, false],
                false,
                ["a", true],
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-reject-null-loose"
                "null",
                [0, "", false, [], "a", "0"],
                null,
                ["a", "0"],
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-reject-zero-loose"
                "0",
                ["a", "0", 0, null, false, "", "0.0"],
                0,
                ["a", ""],
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-reject-numeric-string-loose"
                '"1"',
                [1, "01", "1.0", true, "1e0", "x"],
                "1",
                ["x"],
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-reject-array-value"
                "[1, 2]",
                [[1, 2], [2, 1], ["1", "2"], "x"],
                [1, 2],
                [[2, 1], "x"],
            ],
        ] as [string, unknown[], unknown, unknown[]][])(
            "rejects the items loosely equal to %s",
            (_label, items, value, kept) => {
                expect(collect(items).reject(value).values().all()).toEqual(
                    kept,
                );
            },
        );
    });

    describe("tap", () => {
        describe("Laravel Tests", () => {
            it("test tap", () => {
                // CollectionTest::testTap
                const data = collect([1, 2, 3]);

                const fromTap: number[] = [];
                let tappedInstance: Collection<number, number> | null = null;

                data.tap((col) => {
                    col.slice(0, 1).each((value) => {
                        fromTap.push(value);
                    });
                    tappedInstance = col;
                });

                expect(tappedInstance).toBe(data);
                expect(fromTap).toEqual([1]);
                expect(data.all()).toEqual([1, 2, 3]);
            });
        });
    });

    describe("uniqueStrict", () => {
        describe("Laravel Tests", () => {
            it("test unique strict", () => {
                // CollectionTest::testUniqueStrict
                const c = collect([
                    { id: "0", name: "zero" },
                    { id: "00", name: "double zero" },
                    { id: "0", name: "again zero" },
                ]);

                expect(c.uniqueStrict("id").all()).toEqual([
                    { id: "0", name: "zero" },
                    { id: "00", name: "double zero" },
                ]);
            });
        });

        it("uses strict comparison", () => {
            const c = collect([1, "1", 2, "2", 1]);
            const result = c.uniqueStrict();
            expect(result.all()).toEqual([1, "1", 2, "2"]);
        });

        it("keeps objects with the same entries in another order", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "uniqueStrict-duplicatesStrict-key-order"
            const result = collect([
                { x: 1, y: 2 },
                { y: 2, x: 1 },
            ]).uniqueStrict();
            expect(result.all()).toEqual([
                { x: 1, y: 2 },
                { y: 2, x: 1 },
            ]);
            expect(Object.keys(result.all()[1] as object)).toEqual(["y", "x"]);
        });

        it("compares arrays by value and scalars by type, as PHP's === does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-unique-arrays-strict"
            expect(
                collect([
                    [1, 2],
                    ["1", 2],
                    [1, 2],
                ])
                    .uniqueStrict()
                    .all(),
            ).toEqual([
                [1, 2],
                ["1", 2],
            ]);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-unique-strict-null-key", whose keys
            // [0, 1, 3] name these items; a list renumbers them, as every removal from a list does
            expect(collect([1, "1", 1, true]).unique(null, true).all()).toEqual(
                [1, "1", true],
            );
        });
    });

    describe("collect", () => {
        describe("Laravel Tests", () => {
            it("test collect", () => {
                // CollectionTest::testCollect
                const data = Collection.make({
                    a: 1,
                    b: 2,
                    c: 3,
                }).collect();

                expect(data).toBeInstanceOf(Collection);

                expect(data.all()).toEqual({
                    a: 1,
                    b: 2,
                    c: 3,
                });
            });
        });

        it("copies the items into the new collection", () => {
            const a = collect([1, 2]);
            const b = a.collect();
            b.push(3);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-collect-method-copies"
            expect([a.all(), b.all()]).toEqual([
                [1, 2],
                [1, 2, 3],
            ]);
        });

        it("returns the base class from a subclass", () => {
            class Tagged extends Collection<number, number> {}

            const result = Tagged.make([1]).collect();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-collect-method-returns-base-class"
            expect(result.constructor).toBe(Collection);
            expect(result.all()).toEqual([1]);
        });
    });

    describe("toArray", () => {
        it("test to array", () => {
            // CollectionTest::testToArrayCallsToArrayOnEachItemInCollection
            const data = Collection.make({ a: 1, b: 2, c: 3 });

            expect(data.toArray()).toEqual({ a: 1, b: 2, c: 3 });

            const data2 = Collection.make([1, 2, 3]);

            expect(data2.toArray()).toEqual([1, 2, 3]);

            const data3 = Collection.make([{ a: 1 }, { b: 2 }, { c: 3 }]);

            expect(data3.toArray()).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);

            const data4 = Collection.make([
                Collection.make({ a: 1 }),
                Collection.make({ b: 2 }),
                Collection.make({ c: 3 }),
            ]);

            expect(data4.toArray()).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);

            const data5 = Collection.make({
                a: Collection.make(1),
                b: Collection.make(2),
                c: Collection.make(3),
            });

            expect(data5.toArray()).toEqual({ a: [1], b: [2], c: [3] });

            const data6 = Collection.make({
                a: Collection.make({ x: 1 }),
                b: Collection.make({ y: 2 }),
                c: Collection.make({ z: 3 }),
            });

            expect(data6.toArray()).toEqual({
                a: { x: 1 },
                b: { y: 2 },
                c: { z: 3 },
            });

            class ToArrayTest {
                toArray() {
                    return { test: "value" };
                }
            }

            const data7 = Collection.make({
                a: new ToArrayTest(),
                b: 2,
            });

            expect(data7.toArray()).toEqual({ a: { test: "value" }, b: 2 });
        });

        it("keeps a plain-object item as data, whatever toArray member it holds", () => {
            const toArray = () => [9];

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-toArray-plain-item-members-are-data"
            expect(collect([{ toArray, b: 2 }]).toArray()).toEqual([
                { toArray, b: 2 },
            ]);
        });
    });

    describe("jsonSerialize", () => {
        describe("Laravel Tests", () => {
            it("test jsonSerialize", () => {
                const c = collect([
                    new TestArrayableObject(),
                    new TestJsonableObject(),
                    new TestJsonSerializeObject(),
                    new TestJsonSerializeToStringObject(),
                    "baz",
                ]);

                // CollectionTest::testJsonSerialize
                expect(c.jsonSerialize()).toEqual([
                    { foo: "bar" },
                    { foo: "bar" },
                    { foo: "bar" },
                    "foobar",
                    "baz",
                ]);
            });

            it("test json serialize calls to array or json serialize on each item in collection", () => {
                class JsonItem {
                    jsonSerialize() {
                        return "foo.json";
                    }
                }

                class ArrayItem {
                    toArray() {
                        return "bar.array";
                    }
                }

                const c = new Collection([new JsonItem(), new ArrayItem()]);

                // CollectionTest::testJsonSerializeCallsToArrayOrJsonSerializeOnEachItemInCollection
                expect(c.jsonSerialize()).toEqual(["foo.json", "bar.array"]);
            });
        });

        it("serializes an item by its jsonSerialize() before its toArray()", () => {
            class ArrayableAndJsonSerializable {
                toArray() {
                    return { from: "toArray" };
                }

                jsonSerialize() {
                    return { from: "jsonSerialize" };
                }
            }

            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-A-jsonSerialize-prefers-jsonSerialize-over-toArray"
            expect(
                collect([new ArrayableAndJsonSerializable()]).jsonSerialize(),
            ).toEqual([{ from: "jsonSerialize" }]);
        });

        it("serializes an item by its toJson() before its toArray()", () => {
            class ArrayableAndJsonable {
                toArray() {
                    return { from: "toArray" };
                }

                toJson() {
                    return '{"from":"toJson"}';
                }
            }

            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-A-jsonSerialize-prefers-toJson-over-toArray"
            expect(
                collect([new ArrayableAndJsonable()]).jsonSerialize(),
            ).toEqual([{ from: "toJson" }]);
        });

        it("keeps an object that converts through none of them as that very object", () => {
            class Plain {}

            const item = new Plain();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-jsonSerialize-other-object-is-kept"
            expect(collect([item]).jsonSerialize()[0]).toBe(item);
        });

        it("keeps the keys of a keyed collection", () => {
            const c = collect({ a: new TestArrayableObject(), b: 1 });

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-jsonSerialize-keyed"
            expect(c.jsonSerialize()).toEqual({ a: { foo: "bar" }, b: 1 });
        });

        it("jsonSerialize handles Jsonable with toJSON only", () => {
            class ToJSONOnly {
                toJSON() {
                    return { foo: "bar" };
                }
            }

            const c = collect([new ToJSONOnly()]);

            // JS-only: toJSON is JavaScript's own serialization hook, which PHP has no counterpart for
            expect(c.jsonSerialize()).toEqual([{ foo: "bar" }]);
        });

        it("jsonSerialize handles invalid JSON string from toJson", () => {
            class BadJsonable {
                toJson() {
                    return "not-json";
                }
            }

            const c = collect([new BadJsonable()]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-jsonSerialize-invalid-jsonable-is-null"
            expect(c.jsonSerialize()).toEqual([null]);
        });

        it("jsonSerialize handles Jsonable toJson returning object", () => {
            class ToJsonReturnsObject {
                toJson() {
                    return { x: 1, y: "z" };
                }
            }

            const c = collect([new ToJsonReturnsObject()]);

            // JS-only: PHP's toJson() returns a string; any other answer is taken as already decoded
            expect(c.jsonSerialize()).toEqual([{ x: 1, y: "z" }]);
        });

        it("jsonSerialize passes through raw values unchanged", () => {
            const input = [
                123,
                "hello",
                { a: 1 },
                [1, 2, 3],
                true,
                null,
                undefined,
            ];

            const c = collect(input);

            // JS-only: undefined has no PHP counterpart
            expect(c.jsonSerialize()).toEqual(input);
        });

        it("keeps a plain-object item as data, whatever conversion members it holds", () => {
            const toArray = () => [9];
            const toJson = () => "[1]";
            const jsonSerialize = () => 1;

            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-A-jsonSerialize-plain-item-members-are-data"
            expect(
                collect([
                    { toArray, toJson, jsonSerialize, b: 2 },
                ]).jsonSerialize(),
            ).toEqual([{ toArray, toJson, jsonSerialize, b: 2 }]);
        });

        it("keeps a plain object's toJSON member as data, for JSON.stringify to call", () => {
            const toJSON = () => "x";
            const collection = collect([{ toJSON, b: 2 }]);

            // JS-only: toJSON is JavaScript's own serialization hook, which PHP has no counterpart for
            expect(collection.jsonSerialize()).toEqual([{ toJSON, b: 2 }]);
            expect(collection.toJson()).toBe('["x"]');
        });
    });

    describe("toJson", () => {
        it("toJson returns serialized items by default", () => {
            // CollectionTest::testToJsonEncodesTheJsonSerializeResult
            const c = collect([
                new TestArrayableObject(),
                new TestJsonableObject(),
                new TestJsonSerializeObject(),
                new TestJsonSerializeToStringObject(),
                "baz",
            ]);

            const json = c.toJson();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-jsonSerialize-php-fixtures"
            expect(json).toBe(
                JSON.stringify([
                    { foo: "bar" },
                    { foo: "bar" },
                    { foo: "bar" },
                    "foobar",
                    "baz",
                ]),
            );
        });

        it("toJson supports pretty printing with space", () => {
            // JS-only: JSON.stringify's replacer and space stand in for json_encode's flags
            const c = collect([{ a: 1 }, { b: 2 }]);
            const json = c.toJson(undefined, 2);
            expect(json).toBe(
                JSON.stringify([{ a: 1 }, { b: 2 }], undefined, 2),
            );
        });

        it("toJson with array replacer filters keys", () => {
            // JS-only: JSON.stringify's replacer and space stand in for json_encode's flags
            const c = collect([{ a: 1, b: 2 }, { b: 3 }]);
            const replacer: (string | number)[] = ["b"]; // keep only key 'b'
            const json = c.toJson(replacer);
            expect(json).toBe(JSON.stringify(c.jsonSerialize(), replacer));
        });

        it("toJson with function replacer transforms values", () => {
            // JS-only: JSON.stringify's replacer and space stand in for json_encode's flags
            const c = collect([{ a: 1, b: 2 }, { b: 3 }]);
            const replacer = (key: string, value: unknown) => {
                if (key === "b" && typeof value === "number") {
                    return (value as number) * 10;
                }
                return value;
            };
            const json = c.toJson(replacer);
            expect(json).toBe(JSON.stringify(c.jsonSerialize(), replacer));
        });

        it("toJson with null replacer behaves like no replacer", () => {
            // JS-only: JSON.stringify's replacer and space stand in for json_encode's flags
            const c = collect([{ a: 1, b: 2 }, { b: 3 }]);
            const jsonNull = c.toJson(null);
            const jsonDefault = c.toJson();
            expect(jsonNull).toBe(jsonDefault);
        });

        it("writes / and non-ASCII characters as they are", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-toJson-escapes-slash-and-unicode"
            // JS-only: PHP escapes / and non-ASCII characters; JSON.stringify writes them as they are
            expect(collect(["a/b", "é"]).toJson()).toBe('["a/b","é"]');
        });

        it("encodes keys 0..n-1 in order as a JSON list, whatever the backing", () => {
            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-A-toJson-integer-keys-in-order-are-a-list"
            expect(collect({ 0: "a", 1: "b" }).toJson()).toBe('["a","b"]');
            expect(collect({ 0: "a", 1: "b" }).jsonSerialize()).toEqual([
                "a",
                "b",
            ]);
            expect(
                collect(
                    new Map([
                        [0, "a"],
                        [1, "b"],
                    ]),
                ).toJson(),
            ).toBe('["a","b"]');
        });

        it("encodes integer keys that do not start at 0 as a JSON object", () => {
            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-A-toJson-integer-keys-from-one-are-an-object"
            expect(collect({ 1: "a", 2: "b" }).toJson()).toBe(
                '{"1":"a","2":"b"}',
            );
        });

        it("encodes keys 0 and 1 in the wrong order as a JSON object", () => {
            const collection = collect(
                new Map([
                    [1, "b"],
                    [0, "a"],
                ]),
            );

            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-A-toJson-list-keys-out-of-order-are-an-object"
            expect(JSON.parse(collection.toJson())).toEqual({ 1: "b", 0: "a" });
            expect(Array.isArray(collection.jsonSerialize())).toBe(false);
        });

        it("encodes a keyed collection emptied of its items as []", () => {
            const collection = collect({ a: 1 }).forget("a");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-toJson-emptied-keyed-is-a-list"
            expect(collection.toJson()).toBe("[]");
            expect(collection.jsonSerialize()).toEqual([]);
        });

        it("encodes a list with a hole as an object of the indexes it holds", () => {
            const holes: string[] = [];
            holes[1] = "b";

            // JS-only: PHP has no sparse array; a hole holds no item, so the keys are not 0..n-1
            expect(new Collection(holes).toJson()).toBe('{"1":"b"}');
        });

        it.fails("encodes integer keys in the order PHP keeps them", () => {
            const collection = collect(
                new Map([
                    [2, "a"],
                    [1, "b"],
                ]),
            );

            // Ordered-backing gap: PHP writes the keys in insertion order, 2 before 1
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-toJson-integer-keys-out-of-order"
            expect(collection.toJson()).toBe('{"2":"a","1":"b"}');
        });

        it.fails("encodes a key pushed past a string key last", () => {
            const collection = collect({ a: 1 }).push("z");

            // Ordered-backing gap: PHP writes the pushed key after the string key, a before 0
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-push-onto-string-keyed-toJson"
            expect(collection.toJson()).toBe('{"a":1,"0":"z"}');
        });
    });

    describe("toJSON", () => {
        it("lets JSON.stringify encode the items, as json_encode encodes a JsonSerializable", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-json-encode-collection"
            expect(JSON.stringify(collect([1, 2]))).toBe("[1,2]");
        });

        it("encodes a collection nested in other data by its items", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-json-encode-nested-collection"
            expect(JSON.stringify({ users: collect([{ id: 1 }]) })).toBe(
                '{"users":[{"id":1}]}',
            );
        });

        it("returns what jsonSerialize() returns", () => {
            const c = collect({ a: new TestArrayableObject(), b: 1 });

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-jsonSerialize-keyed"
            // JS-only: toJSON is JavaScript's name for the hook PHP's JsonSerializable calls jsonSerialize
            expect(c.toJSON()).toEqual({ a: { foo: "bar" }, b: 1 });
        });
    });

    describe("toPrettyJson", () => {
        it("returns pretty-printed JSON by default (4 spaces)", () => {
            // CollectionTest::testToPrettyJsonEncodesTheJsonSerializeResult
            const c = collect([
                new TestArrayableObject(),
                new TestJsonableObject(),
                new TestJsonSerializeObject(),
                new TestJsonSerializeToStringObject(),
                "baz",
            ]);

            const pretty = c.toPrettyJson();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-jsonSerialize-php-fixtures"
            const expected = JSON.stringify(
                [
                    { foo: "bar" },
                    { foo: "bar" },
                    { foo: "bar" },
                    "foobar",
                    "baz",
                ],
                undefined,
                4,
            );

            expect(pretty).toBe(expected);
        });

        it("supports custom indentation spaces", () => {
            // JS-only: JSON.stringify's replacer and space stand in for json_encode's flags
            const c = collect([{ a: 1 }, { b: 2 }]);
            const pretty2 = c.toPrettyJson(undefined, 2);
            const pretty4 = c.toPrettyJson(undefined, 4);

            expect(pretty2).toBe(
                JSON.stringify(c.jsonSerialize(), undefined, 2),
            );
            expect(pretty4).toBe(
                JSON.stringify(c.jsonSerialize(), undefined, 4),
            );
        });

        it("supports array replacer to filter keys", () => {
            // JS-only: JSON.stringify's replacer and space stand in for json_encode's flags
            const c = collect([
                { a: 1, b: 2 },
                { b: 3, c: 4 },
            ]);
            const replacer: (string | number)[] = ["b"]; // keep only key 'b'
            const pretty = c.toPrettyJson(replacer, 2);
            expect(pretty).toBe(JSON.stringify(c.jsonSerialize(), replacer, 2));
        });

        it("supports function replacer to transform values", () => {
            // JS-only: JSON.stringify's replacer and space stand in for json_encode's flags
            const c = collect([{ a: 1, b: 2 }, { b: 3 }]);
            const replacer = (key: string, value: unknown) => {
                if (key === "b" && typeof value === "number") {
                    return (value as number) * 10;
                }
                return value;
            };

            const pretty = c.toPrettyJson(replacer, 2);
            expect(pretty).toBe(JSON.stringify(c.jsonSerialize(), replacer, 2));
        });

        it("null replacer behaves like no replacer", () => {
            // JS-only: JSON.stringify's replacer and space stand in for json_encode's flags
            const c = collect([{ a: 1, b: 2 }, { b: 3 }]);
            const prettyNull = c.toPrettyJson(null, 2);
            const prettyDefault = c.toPrettyJson(undefined, 2);
            expect(prettyNull).toBe(prettyDefault);
        });

        it("indents by four spaces a level, as JSON_PRETTY_PRINT does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-toPrettyJson-list"
            expect(collect([1, [2]]).toPrettyJson()).toBe(
                "[\n    1,\n    [\n        2\n    ]\n]",
            );
        });

        it("prints an empty collection as []", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-toPrettyJson-empty"
            expect(collect().toPrettyJson()).toBe("[]");
            expect(collect({}).toPrettyJson()).toBe("[]");
        });
    });

    describe("toString", () => {
        it("toString returns same output as toJson()", () => {
            // CollectionTest::testCastingToStringJsonEncodesTheToArrayResult
            const c = collect([
                new TestArrayableObject(),
                new TestJsonableObject(),
                new TestJsonSerializeObject(),
                new TestJsonSerializeToStringObject(),
                "baz",
            ]);

            const asString = c.toString();
            const asJson = c.toJson();
            expect(asString).toBe(asJson);
        });

        it("toString encodes current jsonSerialize result", () => {
            const c = collect([{ a: 1 }, { b: 2 }]);
            const expected = JSON.stringify(c.jsonSerialize());
            expect(c.toString()).toBe(expected);
        });

        it("toString reflects changes after put operations", () => {
            const c = collect({ a: 1 });
            c.put("b", 2);

            // CollectionTest::testCastingToStringJsonEncodesTheToArrayResult
            expect(c.toString()).toBe('{"a":1,"b":2}');
        });
    });

    describe("escapeWhenCastingToString", () => {
        it("escapes the JSON a string conversion gives, as Laravel's e() does", () => {
            const collection = collect(["<b>"]).escapeWhenCastingToString();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-escape-when-casting-to-string"
            expect(String(collection)).toBe("[&quot;&lt;b&gt;&quot;]");
            expect(collection.toString()).toBe("[&quot;&lt;b&gt;&quot;]");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-escape-when-casting-concat"
            expect(collection + "").toBe("[&quot;&lt;b&gt;&quot;]");
        });

        it("escapes an ampersand and a single quote too, an entity included", () => {
            const collection = collect([
                "&'<>&amp;",
            ]).escapeWhenCastingToString();

            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-A-escape-when-casting-to-string-all-characters"
            expect(String(collection)).toBe(
                "[&quot;&amp;&#039;&lt;&gt;&amp;amp;&quot;]",
            );
        });

        it("stops escaping when handed false", () => {
            const collection = collect(["<b>"])
                .escapeWhenCastingToString()
                .escapeWhenCastingToString(false);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-escape-when-casting-to-string-off"
            expect(String(collection)).toBe('["<b>"]');
        });

        it("leaves toJson() unescaped", () => {
            const collection = collect(["<b>"]).escapeWhenCastingToString();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-escape-when-casting-leaves-toJson"
            expect(collection.toJson()).toBe('["<b>"]');
        });
    });

    describe("operatorForWhere", () => {
        it("handles <=> operator", () => {
            const c = collect([{ val: 1 }, { val: 2 }, { val: 3 }]);
            // Spaceship operator - should return items where comparison is != 0
            const result = c.filter(c["operatorForWhere"]("val", "<=>", 2));
            expect(result.values().all()).toEqual([{ val: 1 }, { val: 3 }]);
        });

        it("handles <=> with null values", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "r3-operator-table",
            // "null vs null" is false and "1 vs null" true: PHP casts null to false, so
            // every truthy value orders above it and only the null row is filtered out.
            const c = collect([{ val: null }, { val: 2 }]);
            const result = c.filter(c["operatorForWhere"]("val", "<=>", null));

            expect(result.values().all()).toEqual([{ val: 2 }]);
        });
    });

    describe("when", () => {
        it("test when", () => {
            // CollectionTest::testWhen
            let data = collect(["michael", "tom"]);

            data = data.when("adam", (collection, newName) => {
                return collection.concat([newName]);
            });

            expect(data.toArray()).toEqual(["michael", "tom", "adam"]);

            data = collect(["michael", "tom"]);

            data = data.when(false, (collection) => {
                return collection.concat(["adam"]);
            });

            expect(data.toArray()).toEqual(["michael", "tom"]);
        });

        it("calls defaultCallback when value is falsy", () => {
            // CollectionTest::testWhenDefault
            const c = collect([1, 2, 3]);
            const result = c.when(
                false,
                (col) => col.map((x) => x * 2),
                (col) => col.map((x) => x + 10),
            );
            expect(result.all()).toEqual([11, 12, 13]);
        });

        it("throws PHP's error for a null callback on the branch it takes", () => {
            const c = collect([1, 2, 3]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-when-null-callback-throws"
            expect(() => Reflect.apply(c.when, c, [true, null])).toThrow(
                new Error("Value of type null is not callable"),
            );
        });

        it("keeps the collection when the branch with a null callback is not taken", () => {
            const c = collect([1]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-when-unless-null-callback-untaken"
            expect(Reflect.apply(c.when, c, [false, null])).toBe(c);
        });

        it("returns self when no callbacks match", () => {
            const c = collect([1, 2, 3]);
            const result = c.when(false, (col) => col.map((x) => x * 2));
            expect(result.all()).toEqual([1, 2, 3]);
        });

        it("returns self when callback returns null", () => {
            const c = collect([1, 2, 3]);
            // callback returns null, so ?? this should be triggered
            const result = c.when(true, () => null);
            expect(result.all()).toEqual([1, 2, 3]);
        });

        it("returns self when callback returns undefined", () => {
            const c = collect([1, 2, 3]);
            // JS-only: undefined stands for the null that PHP's ?? $this replaces
            const result = c.when(true, () => undefined);
            expect(result.all()).toEqual([1, 2, 3]);
        });

        it("resolves value from function and calls callback (isFunction branch)", () => {
            const c = collect([1, 2, 3]);
            // value is a function that returns truthy, callback is called
            const result = c.when(
                () => true,
                (col) => col.map((x) => x * 2),
            );
            expect(result.all()).toEqual([2, 4, 6]);
        });

        it("resolves value from function and calls defaultCallback when falsy", () => {
            const c = collect([1, 2, 3]);
            // value is a function that returns falsy, defaultCallback is called
            const result = c.when(
                () => false,
                (col) => col.map((x) => x * 2),
                (col) => col.map((x) => x + 10),
            );
            expect(result.all()).toEqual([11, 12, 13]);
        });

        it("returns self when defaultCallback returns null", () => {
            const c = collect([1, 2, 3]);
            // value is falsy, defaultCallback returns null, falls back to this
            const result = c.when(
                false,
                (col) => col.map((x) => x * 2),
                () => null,
            );
            expect(result.all()).toEqual([1, 2, 3]);
        });

        it('skips the callback for a "0" or [] condition', () => {
            const c = collect([1]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-when-php-falsy-values"
            expect([
                c.when("0", () => "called") === c,
                c.when([], () => "called") === c,
            ]).toEqual([true, true]);
        });

        it("hands the default the value, and answers a callback's scalar as it is", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-when-default-receives-value" and
            // "C32-H-when-callback-returns-scalar"
            expect([
                collect([1]).when(
                    0,
                    () => "cb",
                    (_collection, value) => JSON.stringify(value),
                ),
                collect([1]).when(true, () => false),
                collect([1]).when(true, () => 42),
            ]).toEqual(["0", false, 42]);
        });

        it("calls a closure value with the collection, but never a string that names a function", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-when-closure-value" and
            // "C32-H-when-callable-string-value-not-invoked"
            expect([
                collect([1, 2]).when(
                    (collection) => collection.count(),
                    (_collection, value) => value * 10,
                ),
                collect([1]).when("strlen", (_collection, value) => value),
            ]).toEqual([20, "strlen"]);
        });
    });

    describe("getArrayableItems", () => {
        it("test get arrayable items", () => {
            // CollectionTest::testGetArrayableItems
            const data = new Collection();

            expect(data["getRawItems"](new TestArrayableObject())).toEqual({
                foo: "bar",
            });
            expect(data["getRawItems"](new TestJsonableObject())).toEqual({
                foo: "bar",
            });
            expect(data["getRawItems"](new TestJsonSerializeObject())).toEqual({
                foo: "bar",
            });
            expect(
                data["getRawItems"](
                    new TestJsonSerializeWithScalarValueObject(),
                ),
            ).toEqual(["foo"]);

            // Only the iterated items are the subject's own objects; jsonSerialize() would rebuild them.
            const subject = [{}, {}];
            const array = data["getRawItems"](
                new TestTraversableAndJsonSerializableObject(subject),
            );
            expect(array).toEqual(subject);
            expect(array[0]).toBe(subject[0]);
            expect(array[1]).toBe(subject[1]);

            expect(data["getRawItems"](new Collection({ foo: "bar" }))).toEqual(
                { foo: "bar" },
            );
            expect(data["getRawItems"]({ foo: "bar" })).toEqual({
                foo: "bar",
            });
        });

        it("handles hasNumericKeys for order preservation", () => {
            // JS-only: a Map stands in for a PHP array whose integer keys are out of order
            // Create a Map with numeric keys to trigger the hasNumericKeys branch
            const map = new Map<number, string>();
            map.set(2, "two");
            map.set(0, "zero");
            map.set(1, "one");
            const c = collect(map);
            // JavaScript objects auto-sort numeric keys, but values() should preserve insertion order
            // when itemsWithOrder is set
            expect(c.values().all()).toEqual(["two", "zero", "one"]);
        });

        it("handles Map with non-numeric keys (false branch)", () => {
            // JS-only: a Map stands in for a keyed PHP array
            // Create a Map with string keys to trigger the hasNumericKeys=false branch
            const map = new Map<string, number>();
            map.set("b", 2);
            map.set("a", 1);
            map.set("c", 3);
            const c = collect(map);
            // String keys don't need order preservation
            expect(c.all()).toEqual({ b: 2, a: 1, c: 3 });
        });
    });

    // Every row pins all three views together: asserting only all() is what let the stale
    // ordering below survive. A JS object re-sorts integer keys ascending (ECMA-262), so all()
    // carries the same ENTRIES as the cited PHP array while values()/keys() carry its ORDER.
    describe("a Map-built backing keeps PHP's order through every mutator", () => {
        /** The PHP array `[2 => 'c', 0 => 'a', 1 => 'b']`, which only a Map expresses in JS. */
        const outOfOrder = () =>
            new Map([
                [2, "c"],
                [0, "a"],
                [1, "b"],
            ]);

        /** `[2 => 'c', 'x' => 'a', 1 => 'b']`, where a string key sits among the integers. */
        const mixedOrder = () =>
            new Map<number | string, string>([
                [2, "c"],
                ["x", "a"],
                [1, "b"],
            ]);

        /** The three views every probe row records, in one comparable object. */
        const views = <
            TValue,
            TKey extends PropertyKey,
            TShape extends CollectionShape,
        >(
            collection: Collection<TValue, TKey, TShape>,
        ) => ({
            all: collection.all(),
            values: collection.values().all(),
            keys: collection.keys().all(),
        });

        it("starts from the order the Map was built in", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-initial"
            expect(views(collection)).toEqual({
                all: { 0: "a", 1: "b", 2: "c" },
                values: ["c", "a", "b"],
                keys: [2, 0, 1],
            });

            // JS-only: PHP's array holds 2, 0, 1; a JS object can only hold them ascending.
            expect(Object.keys(collection.all())).toEqual(["0", "1", "2"]);
        });

        it("shift returns the entry written first and renumbers what is left", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-shift"
            expect(collection.shift()).toBe("c");
            expect(views(collection)).toEqual({
                all: { 0: "a", 1: "b" },
                values: ["a", "b"],
                keys: [0, 1],
            });
        });

        it("shift(2) takes the first two entries written", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-shift-two"
            expect(collection.shift(2).all()).toEqual(["c", "a"]);
            expect(views(collection)).toEqual({
                all: { 0: "b" },
                values: ["b"],
                keys: [0],
            });
        });

        it("shift past the end takes what is there and empties the collection", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-shift-past-the-end"
            expect(collection.shift(5).all()).toEqual(["c", "a", "b"]);
            expect(views(collection)).toEqual({
                all: {},
                values: [],
                keys: [],
            });
        });

        it("shift keeps a string key and renumbers only the integers", () => {
            const collection = collect(mixedOrder());

            // docs/php-parity/task-26-collection-order.json, "order-mixed-shift"
            expect(collection.shift()).toBe("c");
            expect(views(collection)).toEqual({
                all: { 0: "b", x: "a" },
                values: ["a", "b"],
                keys: ["x", 0],
            });
        });

        it("pop returns the entry written last and renumbers nothing", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-pop"
            expect(collection.pop()).toBe("b");
            expect(views(collection)).toEqual({
                all: { 0: "a", 2: "c" },
                values: ["c", "a"],
                keys: [2, 0],
            });
        });

        it("pop(2) returns the last two entries in reverse", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-pop-two"
            expect(collection.pop(2).all()).toEqual(["b", "a"]);
            expect(views(collection)).toEqual({
                all: { 2: "c" },
                values: ["c"],
                keys: [2],
            });
        });

        it("pop past the end takes what is there and empties the collection", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-pop-past-the-end"
            expect(collection.pop(5).all()).toEqual(["b", "a", "c"]);
            expect(views(collection)).toEqual({
                all: {},
                values: [],
                keys: [],
            });
        });

        it("pop answers null once the collection has been emptied", () => {
            const collection = collect(outOfOrder());
            collection.shift(3);

            // docs/php-parity/task-26-collection-order.json, "order-pop-after-emptying"
            expect(collection.pop()).toBeNull();
            expect(views(collection)).toEqual({
                all: {},
                values: [],
                keys: [],
            });
        });

        it("push appends above the highest integer key, not at the count", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-push"
            expect(views(collection.push("x"))).toEqual({
                all: { 0: "a", 1: "b", 2: "c", 3: "x" },
                values: ["c", "a", "b", "x"],
                keys: [2, 0, 1, 3],
            });

            const popped = collect(outOfOrder());
            popped.pop();

            // docs/php-parity/task-26-collection-order.json, "order-pop-then-push"
            expect(views(popped.push("x"))).toEqual({
                all: { 0: "a", 2: "c", 3: "x" },
                values: ["c", "a", "x"],
                keys: [2, 0, 3],
            });
        });

        it("prepend without a key renumbers, the way array_unshift does", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-prepend"
            expect(views(collection.prepend("x"))).toEqual({
                all: { 0: "x", 1: "c", 2: "a", 3: "b" },
                values: ["x", "c", "a", "b"],
                keys: [0, 1, 2, 3],
            });
        });

        it("prepend with a key puts that key first and renumbers nothing", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-prepend-with-key"
            expect(views(collection.prepend("x", "k"))).toEqual({
                all: { 0: "a", 1: "b", 2: "c", k: "x" },
                values: ["x", "c", "a", "b"],
                keys: ["k", 2, 0, 1],
            });
        });

        it("prepend with a null key files it under the empty string", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-prepend-with-null-key"
            expect(views(collection.prepend("x", null))).toEqual({
                all: { 0: "a", 1: "b", 2: "c", "": "x" },
                values: ["x", "c", "a", "b"],
                keys: ["", 2, 0, 1],
            });
        });

        it("prepend with an existing key wins that key outright", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-prepend-with-existing-key"
            expect(views(collection.prepend("x", 1))).toEqual({
                all: { 0: "a", 1: "x", 2: "c" },
                values: ["x", "c", "a"],
                keys: [1, 2, 0],
            });
        });

        it("unshift renumbers the ordered pairs", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-unshift"
            expect(views(collection.unshift("x", "y"))).toEqual({
                all: { 0: "x", 1: "y", 2: "c", 3: "a", 4: "b" },
                values: ["x", "y", "c", "a", "b"],
                keys: [0, 1, 2, 3, 4],
            });
        });

        it("splice removes by position and renumbers both halves", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-splice"
            expect(collection.splice(1, 1).all()).toEqual({ 0: "a" });
            expect(views(collection)).toEqual({
                all: { 0: "c", 1: "b" },
                values: ["c", "b"],
                keys: [0, 1],
            });

            const fromStart = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-splice-two-from-start"
            expect(fromStart.splice(0, 2).all()).toEqual({ 0: "c", 1: "a" });
            expect(views(fromStart)).toEqual({
                all: { 0: "b" },
                values: ["b"],
                keys: [0],
            });
        });

        it("splice's one-argument form removes everything from the offset on", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-splice-to-end"
            expect(collection.splice(1).all()).toEqual({ 0: "a", 1: "b" });
            expect(views(collection)).toEqual({
                all: { 0: "c" },
                values: ["c"],
                keys: [0],
            });
        });

        it("splice counts a negative offset and a negative length from the end", () => {
            const fromEnd = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-splice-negative-offset"
            expect(fromEnd.splice(-2, 1).all()).toEqual({ 0: "a" });
            expect(views(fromEnd)).toEqual({
                all: { 0: "c", 1: "b" },
                values: ["c", "b"],
                keys: [0, 1],
            });

            const leaveOne = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-splice-negative-length"
            expect(leaveOne.splice(1, -1).all()).toEqual({ 0: "a" });
            expect(views(leaveOne)).toEqual({
                all: { 0: "c", 1: "b" },
                values: ["c", "b"],
                keys: [0, 1],
            });
        });

        it("splice inserts the replacement's values at the offset", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-splice-with-replacement"
            expect(collection.splice(1, 1, ["z"]).all()).toEqual({ 0: "a" });
            expect(views(collection)).toEqual({
                all: { 0: "c", 1: "z", 2: "b" },
                values: ["c", "z", "b"],
                keys: [0, 1, 2],
            });
        });

        it("pad pads in insertion order and leaves the source alone", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-pad"
            expect(views(collection.pad(5, "z"))).toEqual({
                all: { 0: "c", 1: "a", 2: "b", 3: "z", 4: "z" },
                values: ["c", "a", "b", "z", "z"],
                keys: [0, 1, 2, 3, 4],
            });

            // docs/php-parity/task-26-collection-order.json, "order-pad-does-not-mutate"
            expect(views(collection)).toEqual({
                all: { 0: "a", 1: "b", 2: "c" },
                values: ["c", "a", "b"],
                keys: [2, 0, 1],
            });

            // docs/php-parity/task-26-collection-order.json, "order-pad-negative"
            expect(views(collect(outOfOrder()).pad(-5, "z"))).toEqual({
                all: { 0: "z", 1: "z", 2: "c", 3: "a", 4: "b" },
                values: ["z", "z", "c", "a", "b"],
                keys: [0, 1, 2, 3, 4],
            });
        });

        it("pad hands back the entries untouched when they are long enough", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-pad-no-padding"
            expect(views(collection.pad(2, "z"))).toEqual({
                all: { 0: "a", 1: "b", 2: "c" },
                values: ["c", "a", "b"],
                keys: [2, 0, 1],
            });
        });

        it("pad keeps a string key and renumbers the integers around it", () => {
            const collection = collect(mixedOrder());

            // docs/php-parity/task-26-collection-order.json, "order-mixed-pad"
            expect(views(collection.pad(5, "p"))).toEqual({
                all: { 0: "c", 1: "b", 2: "p", 3: "p", x: "a" },
                values: ["c", "a", "b", "p", "p"],
                keys: [0, "x", 1, 2, 3],
            });
        });

        it("forget drops its keys and leaves the rest in order", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-forget"
            expect(views(collection.forget(0))).toEqual({
                all: { 1: "b", 2: "c" },
                values: ["c", "b"],
                keys: [2, 1],
            });

            const many = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-forget-many"
            expect(views(many.forget([0, 1]))).toEqual({
                all: { 2: "c" },
                values: ["c"],
                keys: [2],
            });
        });

        it("offsetUnset drops its key and leaves the rest in order", () => {
            const collection = collect(outOfOrder());
            collection.offsetUnset(0);

            // docs/php-parity/task-26-collection-order.json, "order-offsetUnset"
            expect(views(collection)).toEqual({
                all: { 1: "b", 2: "c" },
                values: ["c", "b"],
                keys: [2, 1],
            });
        });

        it("transform keeps every key and visits them in insertion order", () => {
            const collection = collect(outOfOrder());
            const visited: PropertyKey[] = [];

            collection.transform((value, key) => {
                visited.push(key);

                return value.toUpperCase();
            });

            // docs/php-parity/task-26-collection-order.json, "order-transform"
            expect(views(collection)).toEqual({
                all: { 0: "A", 1: "B", 2: "C" },
                values: ["C", "A", "B"],
                keys: [2, 0, 1],
            });

            // docs/php-parity/task-26-collection-order.json, "order-transform-callback-key-order"
            expect(visited).toEqual([2, 0, 1]);
        });

        it("put appends a new key last and updates an existing one in place", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-put"
            expect(views(collection.put("k", "z"))).toEqual({
                all: { 0: "a", 1: "b", 2: "c", k: "z" },
                values: ["c", "a", "b", "z"],
                keys: [2, 0, 1, "k"],
            });

            const existing = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-put-existing-key"
            expect(views(existing.put(0, "z"))).toEqual({
                all: { 0: "z", 1: "b", 2: "c" },
                values: ["c", "z", "b"],
                keys: [2, 0, 1],
            });
        });

        it("offsetSet with a null key appends last", () => {
            const collection = collect(outOfOrder());
            collection.offsetSet(null, "z");

            // docs/php-parity/task-26-collection-order.json, "order-offsetSet-null-key"
            expect(views(collection)).toEqual({
                all: { 0: "a", 1: "b", 2: "c", 3: "z" },
                values: ["c", "a", "b", "z"],
                keys: [2, 0, 1, 3],
            });
        });

        it("sort and sortKeys already answer in PHP's order", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-sort"
            expect(views(collection.sort())).toEqual({
                all: { 0: "a", 1: "b", 2: "c" },
                values: ["a", "b", "c"],
                keys: [0, 1, 2],
            });

            // docs/php-parity/task-26-collection-order.json, "order-sort-does-not-mutate"
            expect(views(collection)).toEqual({
                all: { 0: "a", 1: "b", 2: "c" },
                values: ["c", "a", "b"],
                keys: [2, 0, 1],
            });

            // docs/php-parity/task-26-collection-order.json, "order-sortKeys"
            expect(views(collect(outOfOrder()).sortKeys())).toEqual({
                all: { 0: "a", 1: "b", 2: "c" },
                values: ["a", "b", "c"],
                keys: [0, 1, 2],
            });
        });
    });

    // The positional readers answer by POSITION, so they read the ordered pairs; reading the
    // re-sorted object instead made them answer by key, which is a different entry entirely.
    describe("a Map-built backing answers the positional readers in order", () => {
        /** The PHP array `[2 => 'c', 0 => 'a', 1 => 'b']`, which only a Map expresses in JS. */
        const outOfOrder = () =>
            new Map([
                [2, "c"],
                [0, "a"],
                [1, "b"],
            ]);

        /** The three views every probe row records, in one comparable object. */
        const views = <
            TValue,
            TKey extends PropertyKey,
            TShape extends CollectionShape,
        >(
            collection: Collection<TValue, TKey, TShape>,
        ) => ({
            all: collection.all(),
            values: collection.values().all(),
            keys: collection.keys().all(),
        });

        it("first answers the entry written first, not the lowest key", () => {
            // docs/php-parity/task-26-collection-order.json, "order-first"
            expect(collect(outOfOrder()).first()).toBe("c");
        });

        it("last answers the entry written last, not the highest key", () => {
            // docs/php-parity/task-26-collection-order.json, "order-last"
            expect(collect(outOfOrder()).last()).toBe("b");
        });

        it("first and last walk the callback in insertion order", () => {
            // docs/php-parity/task-26-collection-order.json, "order-first-callback"
            expect(collect(outOfOrder()).first((value) => value !== "c")).toBe(
                "a",
            );

            // docs/php-parity/task-26-collection-order.json, "order-last-callback"
            expect(collect(outOfOrder()).last((value) => value !== "b")).toBe(
                "a",
            );

            const seen: number[] = [];
            collect(outOfOrder()).first((_value, key) => {
                seen.push(key);

                return false;
            });

            // docs/php-parity/task-26-collection-order.json, "order-first-callback-key-order"
            expect(seen).toEqual([2, 0, 1]);
        });

        it("first and last resolve the default when nothing matches", () => {
            // docs/php-parity/task-26-collection-order.json, "order-first-no-match-default"
            expect(collect(outOfOrder()).first(() => false, "fallback")).toBe(
                "fallback",
            );

            // docs/php-parity/task-26-collection-order.json, "order-last-no-match-default"
            expect(collect(outOfOrder()).last(() => false, "fallback")).toBe(
                "fallback",
            );

            // docs/php-parity/task-23-obj-release-readiness.json, "first-assoc-closure-default"
            expect(
                collect(outOfOrder()).first(
                    () => false,
                    () => "thunk",
                ),
            ).toBe("thunk");
        });

        it("slice takes by position and keeps the keys it took", () => {
            // docs/php-parity/task-26-collection-order.json, "order-slice"
            expect(views(collect(outOfOrder()).slice(1))).toEqual({
                all: { 0: "a", 1: "b" },
                values: ["a", "b"],
                keys: [0, 1],
            });

            // docs/php-parity/task-26-collection-order.json, "order-slice-with-length"
            expect(views(collect(outOfOrder()).slice(1, 1))).toEqual({
                all: { 0: "a" },
                values: ["a"],
                keys: [0],
            });
        });

        it("slice reads a negative offset and a negative length as array_slice does", () => {
            // docs/php-parity/task-26-collection-order.json, "order-slice-negative-offset"
            expect(views(collect(outOfOrder()).slice(-2))).toEqual({
                all: { 0: "a", 1: "b" },
                values: ["a", "b"],
                keys: [0, 1],
            });

            // docs/php-parity/task-26-collection-order.json, "order-slice-negative-length"
            expect(views(collect(outOfOrder()).slice(1, -1))).toEqual({
                all: { 0: "a" },
                values: ["a"],
                keys: [0],
            });

            // docs/php-parity/task-26-collection-order.json, "order-slice-offset-past-the-start"
            expect(views(collect(outOfOrder()).slice(-5, 1))).toEqual({
                all: { 2: "c" },
                values: ["c"],
                keys: [2],
            });
        });

        it("slice leaves the source collection alone", () => {
            const collection = collect(outOfOrder());
            collection.slice(1);

            // docs/php-parity/task-26-collection-order.json, "order-slice-does-not-mutate"
            expect(views(collection)).toEqual({
                all: { 0: "a", 1: "b", 2: "c" },
                values: ["c", "a", "b"],
                keys: [2, 0, 1],
            });
        });

        it("slice keeps a string key sitting among the integers", () => {
            const collection = collect(
                new Map<number | string, string>([
                    [2, "c"],
                    ["x", "a"],
                    [1, "b"],
                ]),
            );

            // docs/php-parity/task-26-collection-order.json, "order-mixed-slice"
            expect(views(collection.slice(1))).toEqual({
                all: { x: "a", 1: "b" },
                values: ["a", "b"],
                keys: ["x", 1],
            });
        });

        it("skip and take ride on the same ordered slice", () => {
            // docs/php-parity/task-26-collection-order.json, "order-skip"
            expect(views(collect(outOfOrder()).skip(1))).toEqual({
                all: { 0: "a", 1: "b" },
                values: ["a", "b"],
                keys: [0, 1],
            });

            // docs/php-parity/task-26-collection-order.json, "order-take"
            expect(views(collect(outOfOrder()).take(2))).toEqual({
                all: { 0: "a", 2: "c" },
                values: ["c", "a"],
                keys: [2, 0],
            });

            // docs/php-parity/task-26-collection-order.json, "order-take-negative"
            expect(views(collect(outOfOrder()).take(-2))).toEqual({
                all: { 0: "a", 1: "b" },
                values: ["a", "b"],
                keys: [0, 1],
            });
        });

        it("pull drops its key from every view", () => {
            const collection = collect(outOfOrder());

            // docs/php-parity/task-26-collection-order.json, "order-pull"
            expect(collection.pull(0)).toBe("a");
            expect(views(collection)).toEqual({
                all: { 1: "b", 2: "c" },
                values: ["c", "b"],
                keys: [2, 1],
            });
        });

        it("offsetSet appends a new key last and updates an existing one in place", () => {
            const added = collect(outOfOrder());
            added.offsetSet("k", "z");

            // docs/php-parity/task-26-collection-order.json, "order-array-set-new-key"
            expect(views(added)).toEqual({
                all: { 0: "a", 1: "b", 2: "c", k: "z" },
                values: ["c", "a", "b", "z"],
                keys: [2, 0, 1, "k"],
            });

            const updated = collect(outOfOrder());
            updated.offsetSet(0, "z");

            // docs/php-parity/task-26-collection-order.json, "order-array-set-existing-key"
            expect(views(updated)).toEqual({
                all: { 0: "z", 1: "b", 2: "c" },
                values: ["c", "z", "b"],
                keys: [2, 0, 1],
            });
        });
    });

    // Each row pins all seven views its probe records: a key that only some of them see is the failure.
    describe("keyed writes onto a list backing", () => {
        /** The seven views each probe row records, read at the key the row wrote. */
        const views = <
            TValue,
            TKey extends PropertyKey,
            TShape extends CollectionShape,
        >(
            collection: Collection<TValue, TKey, TShape>,
            key: string | number,
        ) => ({
            all: collection.all(),
            count: collection.count(),
            keys: collection.keys().all(),
            values: collection.values().all(),
            get: collection.get(key),
            has: collection.has(key),
            last: collection.last(),
        });

        it("put keeps a string key after the list's own keys", () => {
            const collection = collect([1, 2]);
            collection.put("x", 3);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-put-string-key-on-list"
            expect(views(collection, "x")).toEqual({
                all: { 0: 1, 1: 2, x: 3 },
                count: 3,
                keys: [0, 1, "x"],
                values: [1, 2, 3],
                get: 3,
                has: true,
                last: 3,
            });
        });

        it("offsetSet keeps a string key after the list's own keys", () => {
            const collection = collect([1, 2]);
            collection.offsetSet("x", 3);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-offsetSet-string-key-on-list"
            expect(views(collection, "x")).toEqual({
                all: { 0: 1, 1: 2, x: 3 },
                count: 3,
                keys: [0, 1, "x"],
                values: [1, 2, 3],
                get: 3,
                has: true,
                last: 3,
            });
        });

        it("getOrPut keeps a string key after the list's own keys", () => {
            const collection = collect([1, 2]);
            const returned = collection.getOrPut("x", 3);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-getOrPut-string-key-on-list"
            expect({ returned, ...views(collection, "x") }).toEqual({
                returned: 3,
                all: { 0: 1, 1: 2, x: 3 },
                count: 3,
                keys: [0, 1, "x"],
                values: [1, 2, 3],
                get: 3,
                has: true,
                last: 3,
            });
        });

        it("getOrPut computes a missing key once on an empty collection", () => {
            const collection = collect();
            let calls = 0;
            const next = () => `v${++calls}`;

            const first = collection.getOrPut("k", next);
            const second = collection.getOrPut("k", next);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-getOrPut-memoizes-on-empty"
            expect({ first, second, calls, all: collection.all() }).toEqual({
                first: "v1",
                second: "v1",
                calls: 1,
                all: { k: "v1" },
            });
            expect(collection.keys().all()).toEqual(["k"]);
            expect(collection.values().all()).toEqual(["v1"]);
        });

        it("put keeps a string key on an empty collection", () => {
            const collection = collect();
            collection.put("foo", 1);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-put-string-key-on-empty"
            expect(views(collection, "foo")).toEqual({
                all: { foo: 1 },
                count: 1,
                keys: ["foo"],
                values: [1],
                get: 1,
                has: true,
                last: 1,
            });
        });

        it("put keeps an integer key past the end without filling the gap", () => {
            const collection = collect([1, 2]);
            collection.put(5, 3);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-put-gap-int-key-on-list"
            expect(views(collection, 5)).toEqual({
                all: { 0: 1, 1: 2, 5: 3 },
                count: 3,
                keys: [0, 1, 5],
                values: [1, 2, 3],
                get: 3,
                has: true,
                last: 3,
            });
        });

        it("put keeps a negative key after the list's own keys", () => {
            const collection = collect([1, 2]);
            collection.put(-1, 3);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-put-negative-key-on-list"
            expect(views(collection, -1)).toEqual({
                all: { 0: 1, 1: 2, "-1": 3 },
                count: 3,
                keys: [0, 1, -1],
                values: [1, 2, 3],
                get: 3,
                has: true,
                last: 3,
            });
        });

        it("put keeps a non-canonical integer string as a string key", () => {
            const collection = collect([1, 2]);
            collection.put("01", 3);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-put-non-canonical-int-string-on-list"
            expect(views(collection, "01")).toEqual({
                all: { 0: 1, 1: 2, "01": 3 },
                count: 3,
                keys: [0, 1, "01"],
                values: [1, 2, 3],
                get: 3,
                has: true,
                last: 3,
            });
        });

        it("put truncates a float key to the index it overwrites", () => {
            const collection = collect([1, 2]);
            collection.put(1.5, 3);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-put-float-key-on-list"
            expect(collection.all()).toEqual([1, 3]);
            expect(collection.keys().all()).toEqual([0, 1]);
            expect(collection.values().all()).toEqual([1, 3]);
            expect(collection.count()).toBe(2);
        });

        it("put casts a boolean key to the index it overwrites", () => {
            const collection = collect([1, 2]);
            collection.put(true, 3);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-put-bool-key-on-list"
            expect(collection.all()).toEqual([1, 3]);
            expect(collection.keys().all()).toEqual([0, 1]);
            expect(collection.values().all()).toEqual([1, 3]);
            expect(collection.count()).toBe(2);
        });

        it("shift after a string-key put renumbers only the integer keys", () => {
            const collection = collect([1, 2]);
            collection.put("x", 3);
            const returned = collection.shift();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-put-string-key-then-shift"
            expect({ returned, all: collection.all() }).toEqual({
                returned: 1,
                all: { 0: 2, x: 3 },
            });
            expect(collection.keys().all()).toEqual([0, "x"]);
            expect(collection.values().all()).toEqual([2, 3]);
        });

        it("push after a string-key put appends last", () => {
            const collection = collect([1, 2]).put("x", 3).push(4);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-put-string-key-then-push"
            expect(collection.all()).toEqual({ 0: 1, 1: 2, x: 3, 2: 4 });
            expect(collection.keys().all()).toEqual([0, 1, "x", 2]);
            expect(collection.values().all()).toEqual([1, 2, 3, 4]);
        });

        it("push after a key named like a method appends last, as data", () => {
            const collection = collect([1, 2]).put("push", 9).push(3);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-put-method-name-then-push"
            expect(collection.all()).toEqual({ 0: 1, 1: 2, push: 9, 2: 3 });
            expect(collection.keys().all()).toEqual([0, 1, "push", 2]);
            expect(collection.values().all()).toEqual([1, 2, 9, 3]);
        });

        it("pop after a string-key put takes the string key's value", () => {
            const collection = collect([1, 2]);
            collection.put("x", 3);
            const returned = collection.pop();

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-put-string-key-then-pop"
            expect(returned).toBe(3);
            expect(collection.keys().all()).toEqual([0, 1]);
            expect(collection.values().all()).toEqual([1, 2]);
            expect(collection.toJson()).toBe("[1,2]");

            // JS-only: the backing stays a record once a string key was written, where PHP's array is a list again
            expect(collection.all()).toEqual({ 0: 1, 1: 2 });
        });

        it("rebuilds a list with a hole without inventing an item for the hole", () => {
            const items: string[] = [];
            items[1] = "b";
            const collection = new Collection(items);
            collection.put("x", "c");

            // JS-only: PHP has no sparse array; a hole holds no item, so the keyed backing gains none there.
            expect(collection.all()).toStrictEqual({ 1: "b", x: "c" });
            expect(collection.keys().all()).toEqual([1, "x"]);
            expect(collection.values().all()).toEqual(["b", "c"]);
            expect(collection.count()).toBe(2);
        });

        it("transform after a string-key put maps the string key too", () => {
            const collection = collect([1, 2]).put("x", 3);
            collection.transform((value) => value * 10);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-put-string-key-then-transform"
            expect(collection.all()).toEqual({ 0: 10, 1: 20, x: 30 });
            expect(collection.keys().all()).toEqual([0, 1, "x"]);
            expect(collection.values().all()).toEqual([10, 20, 30]);
        });
    });

    // `add` appended at the COUNT, which is not a free key: on `{x: 1, 3: 'b', y: 2}` the
    // count is 3, so the append overwrote an entry that was already there.
    describe("a null key appends where PHP's $array[] = does", () => {
        /** The three views every probe row records, in one comparable object. */
        const views = <
            TValue,
            TKey extends PropertyKey,
            TShape extends CollectionShape,
        >(
            collection: Collection<TValue, TKey, TShape>,
        ) => ({
            all: collection.all(),
            values: collection.values().all(),
            keys: collection.keys().all(),
        });

        it("add appends past the highest integer key, not at the count", () => {
            const collection = collect({ 5: "a" });
            collection.add("z");

            // docs/php-parity/task-26-collection-order.json, "append-key-past-the-highest-integer-key"
            expect(views(collection)).toEqual({
                all: { 5: "a", 6: "z" },
                values: ["a", "z"],
                keys: [5, 6],
            });
        });

        it("add never overwrites the entry the count would have landed on", () => {
            const collection = collect({ x: 1, 3: "b", y: 2 });
            collection.add("z");

            // docs/php-parity/task-26-collection-order.json, "append-key-skips-an-occupied-slot"
            expect(collection.all()).toEqual({ x: 1, 3: "b", y: 2, 4: "z" });

            // JS-only: the object literal already holds 3 ahead of x, as a plain object sorts its integer keys first;
            // the appended key still lands last.
            expect(collection.values().all()).toEqual(["b", 1, 2, "z"]);
            expect(collection.keys().all()).toEqual([3, "x", "y", 4]);

            const ordered = collect(
                new Map<string | number, string | number>([
                    ["x", 1],
                    [3, "b"],
                    ["y", 2],
                ]),
            );
            ordered.add("z");

            // docs/php-parity/task-26-collection-order.json, "append-key-skips-an-occupied-slot"
            expect(views(ordered)).toEqual({
                all: { x: 1, 3: "b", y: 2, 4: "z" },
                values: [1, "b", 2, "z"],
                keys: ["x", 3, "y", 4],
            });
        });

        it("a backing with no integer key appends at 0", () => {
            const collection = collect({ a: 1 });
            collection.add("z");

            // docs/php-parity/task-26-collection-order.json, "append-key-with-no-integer-key-is-zero"
            expect(views(collection)).toEqual({
                all: { a: 1, 0: "z" },
                values: [1, "z"],
                keys: ["a", 0],
            });
        });

        it("an empty object backing appends at 0", () => {
            const collection = collect({});
            collection.add("z");

            // docs/php-parity/task-26-collection-order.json, "append-key-on-an-empty-collection-is-zero".
            // The row's `collect([])` is PHP's only empty array; `{}` picks the object branch here.
            expect(views(collection)).toEqual({
                all: { 0: "z" },
                values: ["z"],
                keys: [0],
            });
        });

        it("two appends keep counting up from the highest key", () => {
            const collection = collect({ 5: "a" });
            collection.add("y");
            collection.add("z");

            // docs/php-parity/task-26-collection-order.json, "append-key-twice-keeps-counting-up"
            expect(views(collection)).toEqual({
                all: { 5: "a", 6: "y", 7: "z" },
                values: ["a", "y", "z"],
                keys: [5, 6, 7],
            });
        });

        it("offsetSet with a null key picks the same slot as add", () => {
            const collection = collect({ 5: "a" });
            collection.offsetSet(null, "z");

            // docs/php-parity/task-26-collection-order.json, "append-key-offsetSet-null-matches-add"
            expect(views(collection)).toEqual({
                all: { 5: "a", 6: "z" },
                values: ["a", "z"],
                keys: [5, 6],
            });
        });

        it("keeps the ordered view's append last", () => {
            const collection = collect(
                new Map([
                    [2, "c"],
                    [0, "a"],
                    [1, "b"],
                ]),
            );
            collection.add("z");

            // docs/php-parity/task-26-collection-order.json, "append-key-on-the-out-of-order-base"
            expect(views(collection)).toEqual({
                all: { 0: "a", 1: "b", 2: "c", 3: "z" },
                values: ["c", "a", "b", "z"],
                keys: [2, 0, 1, 3],
            });
        });

        it("counts on from a negative key, as PHP 8.3 does", () => {
            const collection = collect({ "-3": "a" });
            collection.add("z");

            // docs/php-parity/task-26-collection-order.json, "append-key-after-a-negative-key"
            expect(views(collection)).toEqual({
                all: { "-3": "a", "-2": "z" },
                values: ["a", "z"],
                keys: [-3, -2],
            });
        });

        it("counts on from the highest key held now, not the highest ever held", () => {
            const collection = collect({ 5: "a", 6: "b" }).forget(6).push("x");

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-forget-max-int-key-then-push"
            // JS-only: PHP remembers the largest integer key ever used; a plain object cannot
            expect(views(collection)).toEqual({
                all: { 5: "a", 6: "x" },
                values: ["a", "x"],
                keys: [5, 6],
            });
        });
    });

    // `getRawItems` used to write `this.itemsWithOrder` while READING an operand, so a
    // read-only call wrote the receiver a fresh view built from somebody else's keys.
    describe("reading an operand never writes the receiver's ordered view", () => {
        /** The three views every probe row records, in one comparable object. */
        const views = <
            TValue,
            TKey extends PropertyKey,
            TShape extends CollectionShape,
        >(
            collection: Collection<TValue, TKey, TShape>,
        ) => ({
            all: collection.all(),
            values: collection.values().all(),
            keys: collection.keys().all(),
        });

        /** `[7 => 'x', 3 => 'y']`: an operand whose order a plain object cannot hold. */
        const operand = () =>
            new Map([
                [7, "x"],
                [3, "y"],
            ]);

        const untouched = {
            all: [1, 2, 3],
            values: [1, 2, 3],
            keys: [0, 1, 2],
        };

        it("union against a Map operand leaves the receiver's three views alone", () => {
            const collection = collect([1, 2, 3]);
            collection.union(operand());

            // docs/php-parity/task-26-collection-order.json, "order-union-leaves-the-receiver-alone"
            expect(views(collection)).toEqual(untouched);
        });

        it("diff leaves the receiver's three views alone", () => {
            const collection = collect([1, 2, 3]);

            // `diff`'s operand type takes a Collection, not a bare Map; the Collection
            // built from one carries the same ordered view, so it pins the same defect.
            collection.diff(collect(operand()));

            // docs/php-parity/task-26-collection-order.json, "order-diff-leaves-the-receiver-alone"
            expect(views(collection)).toEqual(untouched);
        });

        it("every set operation that reads an operand stays read-only", () => {
            const readers: Array<
                [string, (collection: Collection<number, number>) => unknown]
            > = [
                // Each row cites docs/php-parity/task-26-collection-order.json:
                // "order-merge-leaves-the-receiver-alone"
                ["merge", (c) => c.merge(operand())],
                // "order-intersect-leaves-the-receiver-alone"
                ["intersect", (c) => c.intersect(operand())],
                // "order-replace-leaves-the-receiver-alone"
                ["replace", (c) => c.replace(operand())],
                // "order-only-leaves-the-receiver-alone"
                ["only", (c) => c.only(collect(operand()))],
                // "order-zip-leaves-the-receiver-alone"
                ["zip", (c) => c.zip(collect(operand()))],
                // "order-crossJoin-leaves-the-receiver-alone"
                ["crossJoin", (c) => c.crossJoin(collect(operand()))],
            ];

            for (const [name, read] of readers) {
                const collection = collect([1, 2, 3]);
                read(collection);

                // Every row above records the same thing: the receiver is untouched.
                expect({ name, ...views(collection) }).toEqual({
                    name,
                    ...untouched,
                });
            }
        });

        it("a Map with a symbol key builds instead of throwing", () => {
            const marker = Symbol("marker");

            // JS-only: PHP has no symbol key, and Number(symbol) threw inside the constructor.
            const collection = collect(
                new Map<symbol | number, string>([
                    [marker, "s"],
                    [2, "c"],
                    [0, "a"],
                ]),
            );

            expect((collection.all() as Record<symbol, string>)[marker]).toBe(
                "s",
            );

            // A symbol has no PHP order to keep, so its presence suppresses the ordered view.
            expect(views(collection)).toEqual({
                all: collection.all(),
                values: ["a", "c"],
                keys: [0, 2],
            });
        });

        it("drops a symbol key from the receiver and from a Map operand in every set operation", () => {
            const marker = Symbol("marker");
            const receiver = () =>
                collect(
                    new Map<string | symbol, unknown>([
                        ["a", 1],
                        [marker, "s"],
                    ]),
                );
            const operand = () =>
                new Map<number | symbol, unknown>([
                    [3, "x"],
                    [marker, "t"],
                    [1, "y"],
                ]);

            // JS-only: PHP has no symbol key, so each set operation reads only the keys a PHP array can hold,
            // and the order its integer keys come in survives
            const renumbered = {
                all: { a: 1, 0: "x", 1: "y" },
                values: [1, "x", "y"],
                keys: ["a", 0, 1],
            };
            const kept = {
                all: { a: 1, 3: "x", 1: "y" },
                values: [1, "x", "y"],
                keys: ["a", 3, 1],
            };
            const results = [
                ["merge", receiver().merge(operand()), renumbered],
                [
                    "mergeRecursive",
                    receiver().mergeRecursive(operand()),
                    renumbered,
                ],
                ["union", receiver().union(operand()), kept],
                ["replace", receiver().replace(operand()), kept],
                [
                    "replaceRecursive",
                    receiver().replaceRecursive(operand()),
                    kept,
                ],
            ] as const;

            for (const [name, result, expected] of results) {
                expect({
                    name,
                    symbols: Object.getOwnPropertySymbols(result.all()),
                    all: result.all(),
                    values: result.values().all(),
                    keys: result.keys().all(),
                }).toEqual({ name, symbols: [], ...expected });
            }
        });
    });

    // `concat` and `join` built their working copy with `newInstance(this.items)`, which
    // ALIASES the backing, so `push`/`pop` on the copy wrote this collection: `concat`
    // appended to its own receiver and `join` deleted the receiver's last entry.
    describe("concat and join work on a copy, never on the receiver", () => {
        /** The PHP array `[2 => 'c', 0 => 'a', 1 => 'b']`, which only a Map expresses in JS. */
        const outOfOrder = () =>
            new Map([
                [2, "c"],
                [0, "a"],
                [1, "b"],
            ]);

        /** The three views every probe row records, in one comparable object. */
        const views = <
            TValue,
            TKey extends PropertyKey,
            TShape extends CollectionShape,
        >(
            collection: Collection<TValue, TKey, TShape>,
        ) => ({
            all: collection.all(),
            values: collection.values().all(),
            keys: collection.keys().all(),
        });

        it("concat leaves every backing's receiver untouched", () => {
            const list = collect([1, 2, 3]);
            const listBacking = list.all();
            list.concat(["z"]);

            // docs/php-parity/task-27-carried-fixes.json, "concat-list-leaves-the-receiver-alone"
            expect(views(list)).toEqual({
                all: [1, 2, 3],
                values: [1, 2, 3],
                keys: [0, 1, 2],
            });
            expect(list.all()).toBe(listBacking);

            const keyed = collect({ a: 1, b: 2 });
            keyed.concat(["z"]);

            // docs/php-parity/task-27-carried-fixes.json, "concat-keyed-leaves-the-receiver-alone"
            expect(views(keyed)).toEqual({
                all: { a: 1, b: 2 },
                values: [1, 2],
                keys: ["a", "b"],
            });

            const ordered = collect(outOfOrder());
            ordered.concat(["z"]);

            // docs/php-parity/task-27-carried-fixes.json,
            // "concat-out-of-order-leaves-the-receiver-alone"
            expect(views(ordered)).toEqual({
                all: { 0: "a", 1: "b", 2: "c" },
                values: ["c", "a", "b"],
                keys: [2, 0, 1],
            });
        });

        it("concat answers a collection over its own backing", () => {
            const receiver = collect({ a: 1, b: 2 });
            const result = receiver.concat(["z"]);

            expect(result.all()).not.toBe(receiver.all());

            // docs/php-parity/task-27-carried-fixes.json, "concat-keyed-result"
            expect(views(result)).toEqual({
                all: { a: 1, b: 2, 0: "z" },
                values: [1, 2, "z"],
                keys: ["a", "b", 0],
            });

            // docs/php-parity/task-27-carried-fixes.json, "concat-list-result"
            expect(views(collect([1, 2, 3]).concat(["z"]))).toEqual({
                all: [1, 2, 3, "z"],
                values: [1, 2, 3, "z"],
                keys: [0, 1, 2, 3],
            });
        });

        it("concat keeps the receiver's order in the result", () => {
            // docs/php-parity/task-27-carried-fixes.json, "concat-out-of-order-result"
            expect(views(collect(outOfOrder()).concat(["z"]))).toEqual({
                all: { 0: "a", 1: "b", 2: "c", 3: "z" },
                values: ["c", "a", "b", "z"],
                keys: [2, 0, 1, 3],
            });

            // docs/php-parity/task-27-carried-fixes.json, "concat-collection-operand-result"
            expect(views(collect([1, 2]).concat(collect({ x: "z" })))).toEqual({
                all: [1, 2, "z"],
                values: [1, 2, "z"],
                keys: [0, 1, 2],
            });
        });

        it("join leaves every backing's receiver untouched", () => {
            const list = collect([1, 2, 3]);
            const listBacking = list.all();
            list.join(", ", " and ");

            // docs/php-parity/task-27-carried-fixes.json, "join-list-leaves-the-receiver-alone"
            expect(views(list)).toEqual({
                all: [1, 2, 3],
                values: [1, 2, 3],
                keys: [0, 1, 2],
            });
            expect(list.all()).toBe(listBacking);

            const keyed = collect({ a: 1, b: 2 });
            keyed.join(", ", " and ");

            // docs/php-parity/task-27-carried-fixes.json, "join-keyed-leaves-the-receiver-alone"
            expect(views(keyed)).toEqual({
                all: { a: 1, b: 2 },
                values: [1, 2],
                keys: ["a", "b"],
            });

            const ordered = collect(outOfOrder());
            ordered.join(", ", " and ");

            // docs/php-parity/task-27-carried-fixes.json,
            // "join-out-of-order-leaves-the-receiver-alone"
            expect(views(ordered)).toEqual({
                all: { 0: "a", 1: "b", 2: "c" },
                values: ["c", "a", "b"],
                keys: [2, 0, 1],
            });
        });

        it("join still answers what PHP answers", () => {
            // docs/php-parity/task-27-carried-fixes.json, "join-list-result"
            expect(collect([1, 2, 3]).join(", ", " and ")).toBe("1, 2 and 3");

            // docs/php-parity/task-27-carried-fixes.json, "join-keyed-result"
            expect(collect({ a: 1, b: 2 }).join(", ", " and ")).toBe("1 and 2");

            // docs/php-parity/task-27-carried-fixes.json, "join-single-entry-result"
            expect(collect({ a: 1 }).join(", ", " and ")).toBe(1);

            // docs/php-parity/task-27-carried-fixes.json, "join-empty-result"
            expect(collect([]).join(", ", " and ")).toBe("");
        });

        it("join and implode read a Map backing in PHP's order", () => {
            // docs/php-parity/task-27-carried-fixes.json, "join-out-of-order-result"
            expect(collect(outOfOrder()).join(", ", " and ")).toBe(
                "c, a and b",
            );

            // docs/php-parity/task-27-carried-fixes.json, "join-out-of-order-no-final-glue"
            expect(collect(outOfOrder()).join(", ")).toBe("c, a, b");

            // docs/php-parity/task-27-carried-fixes.json, "implode-out-of-order"
            expect(collect(outOfOrder()).implode("-")).toBe("c-a-b");
        });

        it("implode reads a Map backing in order through a key and a callback", () => {
            const rows = collect(
                new Map([
                    [2, { n: "c" }],
                    [0, { n: "a" }],
                ]),
            );

            // docs/php-parity/task-27-carried-fixes.json, "implode-out-of-order-pluck"
            expect(rows.implode("n", "-")).toBe("c-a");

            // docs/php-parity/task-27-carried-fixes.json, "implode-out-of-order-callback"
            expect(
                collect(outOfOrder()).implode(
                    (value) => value.toUpperCase(),
                    "-",
                ),
            ).toBe("C-A-B");
        });
    });

    describe("newInstance subclass extensibility", () => {
        class TestCollectionWithExtraState<
            TValue = unknown,
            TKey extends PropertyKey = number,
        > extends Collection<TValue, TKey> {
            public tag: string;

            constructor(
                items?:
                    | TValue[]
                    | Record<TKey, TValue>
                    | Collection<TValue, TKey>,
                tag: string = "",
            ) {
                super(items);
                this.tag = tag;
            }

            protected override newInstance<
                TNewValue,
                TNewKey extends PropertyKey,
                TNewShape extends CollectionShape,
            >(
                items: DataItems<TNewValue, TNewKey>,
            ): Collection<TNewValue, TNewKey, TNewShape> {
                const Ctor = this.constructor as new (
                    items: DataItems<TNewValue, TNewKey>,
                    tag?: string,
                ) => Collection<TNewValue, TNewKey, TNewShape>;
                return new Ctor(items, this.tag);
            }
        }

        it("preserves subclass type and extra state through filter", () => {
            // CollectionTest::testNewInstanceIsUsedByCollectionMethods
            const collection = new TestCollectionWithExtraState(
                [1, 2, 3, 4, 5],
                "my-tag",
            );
            const filtered = collection.filter((v) => v > 3);
            expect(filtered).toBeInstanceOf(TestCollectionWithExtraState);
            expect(filtered.tag).toBe("my-tag");
            expect(Object.values(filtered.all())).toEqual([4, 5]);
        });

        it("preserves subclass type through filter returning empty", () => {
            // CollectionTest::testNewInstanceIsUsedByCollectionMethods
            const collection = new TestCollectionWithExtraState(
                [1, 2, 3, 4, 5],
                "my-tag",
            );
            const empty = collection.filter((v) => v > 100);
            expect(empty).toBeInstanceOf(TestCollectionWithExtraState);
            expect(empty.tag).toBe("my-tag");
        });

        it("preserves subclass type through reject", () => {
            // CollectionTest::testNewInstanceIsUsedByCollectionMethods
            const collection = new TestCollectionWithExtraState(
                [1, 2, 3, 4, 5],
                "my-tag",
            );
            const rejected = collection.reject((v) => v <= 2);
            expect(rejected).toBeInstanceOf(TestCollectionWithExtraState);
            expect(rejected.tag).toBe("my-tag");
        });

        it("preserves subclass type through map", () => {
            // CollectionTest::testNewInstanceIsUsedByCollectionMethods
            const collection = new TestCollectionWithExtraState(
                [1, 2, 3, 4, 5],
                "my-tag",
            );
            const mapped = collection.map((v) => v * 2);
            expect(mapped).toBeInstanceOf(TestCollectionWithExtraState);
            expect(mapped.tag).toBe("my-tag");
            expect(mapped.all()).toEqual([2, 4, 6, 8, 10]);
        });

        it("preserves subclass type through values", () => {
            // CollectionTest::testNewInstanceIsUsedByCollectionMethods
            const collection = new TestCollectionWithExtraState(
                [1, 2, 3, 4, 5],
                "my-tag",
            );
            const filtered = collection.filter((v) => v > 3);
            const values = filtered.values();
            expect(values).toBeInstanceOf(TestCollectionWithExtraState);
            expect(values.tag).toBe("my-tag");
        });

        it("preserves subclass type through unique", () => {
            // CollectionTest::testNewInstanceIsUsedByCollectionMethods
            const duped = new TestCollectionWithExtraState(
                [1, 1, 2, 2, 3],
                "u-tag",
            );
            const unique = duped.unique();
            expect(unique).toBeInstanceOf(TestCollectionWithExtraState);
            expect(unique.tag).toBe("u-tag");
        });

        it("preserves subclass type through keys", () => {
            // CollectionTest::testNewInstanceIsUsedByCollectionMethods
            const collection = new TestCollectionWithExtraState(
                [1, 2, 3, 4, 5],
                "my-tag",
            );
            const keys = collection.keys();
            expect(keys).toBeInstanceOf(TestCollectionWithExtraState);
            expect((keys as unknown as TestCollectionWithExtraState).tag).toBe(
                "my-tag",
            );
        });

        it("preserves subclass type through sort", () => {
            // CollectionTest::testNewInstanceIsUsedByCollectionMethods
            const collection = new TestCollectionWithExtraState(
                [1, 2, 3, 4, 5],
                "my-tag",
            );
            const sorted = collection.sort();
            expect(sorted).toBeInstanceOf(TestCollectionWithExtraState);
            expect(sorted.tag).toBe("my-tag");
        });

        it("preserves subclass type through slice", () => {
            // CollectionTest::testNewInstanceIsUsedByCollectionMethods
            const collection = new TestCollectionWithExtraState(
                [1, 2, 3, 4, 5],
                "my-tag",
            );
            const sliced = collection.slice(1, 2);
            expect(sliced).toBeInstanceOf(TestCollectionWithExtraState);
            expect(sliced.tag).toBe("my-tag");
        });

        it("preserves subclass type through chunk (outer and inner)", () => {
            // CollectionTest::testNewInstanceIsUsedByCollectionMethods
            const collection = new TestCollectionWithExtraState(
                [1, 2, 3, 4, 5],
                "my-tag",
            );
            const chunks = collection.chunk(2);
            expect(chunks).toBeInstanceOf(TestCollectionWithExtraState);
            expect(
                (chunks as unknown as TestCollectionWithExtraState).tag,
            ).toBe("my-tag");
            const first = chunks.first();
            expect(first).toBeInstanceOf(TestCollectionWithExtraState);
            expect((first as unknown as TestCollectionWithExtraState).tag).toBe(
                "my-tag",
            );
        });

        it("preserves subclass type through merge", () => {
            // CollectionTest::testNewInstanceIsUsedByCollectionMethods
            const collection = new TestCollectionWithExtraState(
                [1, 2, 3, 4, 5],
                "my-tag",
            );
            const merged = collection.merge([6, 7]);
            expect(merged).toBeInstanceOf(TestCollectionWithExtraState);
            expect(merged.tag).toBe("my-tag");
        });

        it("preserves subclass type through diff", () => {
            // CollectionTest::testNewInstanceIsUsedByCollectionMethods
            const collection = new TestCollectionWithExtraState(
                [1, 2, 3, 4, 5],
                "my-tag",
            );
            const diff = collection.diff([1, 2]);
            expect(diff).toBeInstanceOf(TestCollectionWithExtraState);
            expect(diff.tag).toBe("my-tag");
        });

        it("preserves subclass type through partition", () => {
            // CollectionTest::testNewInstanceIsUsedByCollectionMethods
            const collection = new TestCollectionWithExtraState(
                [1, 2, 3, 4, 5],
                "my-tag",
            );
            const [pass, fail] = collection.partition((v) => v > 3);
            expect(pass).toBeInstanceOf(TestCollectionWithExtraState);
            expect((pass as unknown as TestCollectionWithExtraState).tag).toBe(
                "my-tag",
            );
            expect(fail).toBeInstanceOf(TestCollectionWithExtraState);
            expect((fail as unknown as TestCollectionWithExtraState).tag).toBe(
                "my-tag",
            );
        });

        it("preserves subclass type through pluck", () => {
            // CollectionTest::testNewInstanceIsUsedByCollectionMethods
            const assoc = new TestCollectionWithExtraState(
                [{ name: "Taylor" }, { name: "Nuno" }],
                "p-tag",
            );
            const plucked = assoc.pluck("name");
            expect(plucked).toBeInstanceOf(TestCollectionWithExtraState);
            expect(
                (plucked as unknown as TestCollectionWithExtraState).tag,
            ).toBe("p-tag");
        });

        it("preserves subclass type through reverse", () => {
            // CollectionTest::testNewInstanceIsUsedByCollectionMethods
            const collection = new TestCollectionWithExtraState(
                [1, 2, 3, 4, 5],
                "my-tag",
            );
            const reversed = collection.reverse();
            expect(reversed).toBeInstanceOf(TestCollectionWithExtraState);
            expect(reversed.tag).toBe("my-tag");
        });

        it("preserves subclass type through flatten", () => {
            // CollectionTest::testNewInstanceIsUsedByCollectionMethods
            const nested = new TestCollectionWithExtraState(
                [
                    [1, 2],
                    [3, 4],
                ],
                "f-tag",
            );
            const flat = nested.flatten();
            expect(flat).toBeInstanceOf(TestCollectionWithExtraState);
            expect(flat.tag).toBe("f-tag");
        });

        it("preserves subclass type through pad", () => {
            // CollectionTest::testNewInstanceIsUsedByCollectionMethods
            const collection = new TestCollectionWithExtraState(
                [1, 2, 3, 4, 5],
                "my-tag",
            );
            const padded = collection.pad(7, 0);
            expect(padded).toBeInstanceOf(TestCollectionWithExtraState);
            expect(padded.tag).toBe("my-tag");
        });

        it("preserves subclass type and extra state through groupBy, at every level", () => {
            const levels: unknown[] = [];
            let level: unknown = new TestCollectionWithExtraState(
                [{ a: 1, b: "x" }],
                "my-tag",
            ).groupBy(["a", "b"]);

            while (level instanceof Collection) {
                levels.push(level);
                level = level.first();
            }

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-groupBy-groups-keep-subclass"
            expect(levels).toHaveLength(3);
            for (const each of levels) {
                expect(each).toBeInstanceOf(TestCollectionWithExtraState);
                expect(each).toHaveProperty("tag", "my-tag");
            }
        });

        it("test static factory methods forward extra arguments", () => {
            // CollectionTest::testStaticFactoryMethodsForwardExtraArguments
            const made = TestCollectionWithExtraState.make(
                [1, 2, 3],
                "make-tag",
            );
            expect(made).toBeInstanceOf(TestCollectionWithExtraState);
            expect(made).toHaveProperty("tag", "make-tag");
            expect(made.all()).toEqual([1, 2, 3]);

            const wrapped = TestCollectionWithExtraState.wrap(
                [4, 5],
                "wrap-tag",
            );
            expect(wrapped).toBeInstanceOf(TestCollectionWithExtraState);
            expect(wrapped).toHaveProperty("tag", "wrap-tag");
            expect(wrapped.all()).toEqual([4, 5]);

            const empty = TestCollectionWithExtraState.empty("empty-tag");
            expect(empty).toBeInstanceOf(TestCollectionWithExtraState);
            expect(empty).toHaveProperty("tag", "empty-tag");
            expect(empty.all()).toEqual([]);

            const range = TestCollectionWithExtraState.range(
                1,
                3,
                1,
                "range-tag",
            );
            expect(range).toBeInstanceOf(TestCollectionWithExtraState);
            expect(range).toHaveProperty("tag", "range-tag");
            expect(range.all()).toEqual([1, 2, 3]);

            const times = TestCollectionWithExtraState.times(
                3,
                (i) => i * 10,
                "times-tag",
            );
            expect(times).toBeInstanceOf(TestCollectionWithExtraState);
            expect(times).toHaveProperty("tag", "times-tag");
            expect(times.all()).toEqual([10, 20, 30]);

            const timesZero = TestCollectionWithExtraState.times(
                0,
                null,
                "zero-tag",
            );
            expect(timesZero).toBeInstanceOf(TestCollectionWithExtraState);
            expect(timesZero).toHaveProperty("tag", "zero-tag");
            expect(timesZero.all()).toEqual([]);

            const json = TestCollectionWithExtraState.fromJson(
                '["a","b"]',
                512,
                0,
                "json-tag",
            );
            expect(json).toBeInstanceOf(TestCollectionWithExtraState);
            expect(json).toHaveProperty("tag", "json-tag");
            expect(json.all()).toEqual(["a", "b"]);
        });

        it("keeps the calling subclass in every static factory", () => {
            class Sub extends Collection<unknown, PropertyKey> {}

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-A-static-factories-keep-subclass"
            expect({
                make: Sub.make([1]).constructor,
                wrap: Sub.wrap([1]).constructor,
                empty: Sub.empty().constructor,
                range: Sub.range(1, 3).constructor,
                times: Sub.times(3).constructor,
                "times-callback": Sub.times(3, (i) => i * 10).constructor,
                fromJson: Sub.fromJson("[1]").constructor,
            }).toEqual({
                make: Sub,
                wrap: Sub,
                empty: Sub,
                range: Sub,
                times: Sub,
                "times-callback": Sub,
                fromJson: Sub,
            });
        });
    });

    // Collection half of the cross-backing agreement sweep; the row-by-row sweep over
    // the ported arr/obj/data code lives in data.spec.ts. Four methods here carry their
    // own implementation, so this block is the only thing checking them.
    describe("cross-backing agreement sweep (plan exit criterion)", () => {
        /** Own key/value pairs — the one view an array and a plain object share. */
        const entriesOf = (value: unknown): [string, unknown][] =>
            Object.entries(value as object);

        /** Pin both backings' pairs, then assert their value sequences match. */
        function agree(
            fromArray: unknown,
            fromObject: unknown,
            arrEntries: [string, unknown][],
            objEntries: [string, unknown][] = arrEntries,
        ): void {
            expect(entriesOf(fromArray)).toEqual(arrEntries);
            expect(entriesOf(fromObject)).toEqual(objEntries);
            expect(Object.values(fromArray as object)).toEqual(
                Object.values(fromObject as object),
            );
        }

        const nums = (): number[] => [10, 20, 30, 40];
        const numsObj = (): Record<string, number> => ({
            0: 10,
            1: 20,
            2: 30,
            3: 40,
        });
        const numsEntries: [string, unknown][] = [
            ["0", 10],
            ["1", 20],
            ["2", 30],
            ["3", 40],
        ];
        const records = () => [
            { id: 3, name: "c" },
            { id: 1, name: "a" },
            { id: 2, name: "b" },
        ];
        const recordsObj = () => ({
            0: { id: 3, name: "c" },
            1: { id: 1, name: "a" },
            2: { id: 2, name: "b" },
        });

        it("pop, either backing", () => {
            // collect([10,20,30,40])->pop() -> 40, leaving [10,20,30].
            const fromArray = new Collection(nums());
            const fromObject = new Collection(numsObj());

            expect(fromArray.pop()).toBe(40);
            expect(fromObject.pop()).toBe(40);
            agree(fromArray.all(), fromObject.all(), [
                ["0", 10],
                ["1", 20],
                ["2", 30],
            ]);
        });

        it("shift, either backing", () => {
            // collect([10,20,30,40])->shift() -> 10, leaving [20,30,40].
            // The object branch used to leave a hole at 0 instead.
            const fromArray = new Collection(nums());
            const fromObject = new Collection(numsObj());

            expect(fromArray.shift()).toBe(10);
            expect(fromObject.shift()).toBe(10);
            agree(fromArray.all(), fromObject.all(), [
                ["0", 20],
                ["1", 30],
                ["2", 40],
            ]);

            const twoFromArray = new Collection(nums());
            const twoFromObject = new Collection(numsObj());
            agree(twoFromArray.shift(2).all(), twoFromObject.shift(2).all(), [
                ["0", 10],
                ["1", 20],
            ]);
            agree(twoFromArray.all(), twoFromObject.all(), [
                ["0", 30],
                ["1", 40],
            ]);
        });

        it("unshift, either backing (Collection's own implementation)", () => {
            // array_unshift([10,20,30,40],1,2) -> [1,2,10,20,30,40].
            agree(
                new Collection(nums()).unshift(1, 2).all(),
                new Collection(numsObj()).unshift(1, 2).all(),
                [
                    ["0", 1],
                    ["1", 2],
                    ["2", 10],
                    ["3", 20],
                    ["4", 30],
                    ["5", 40],
                ],
            );

            // numsObj() alone is all-canonical-integer, so it can't see a
            // non-canonical key like "1.5" wrongly swept into the renumbered run.
            agree(
                new Collection([10, 20, 30, 40, 999]).unshift(1, 2).all(),
                new Collection({ 0: 10, 1: 20, 2: 30, 3: 40, "1.5": 999 })
                    .unshift(1, 2)
                    .all(),
                [
                    ["0", 1],
                    ["1", 2],
                    ["2", 10],
                    ["3", 20],
                    ["4", 30],
                    ["5", 40],
                    ["6", 999],
                ],
                [
                    ["0", 1],
                    ["1", 2],
                    ["2", 10],
                    ["3", 20],
                    ["4", 30],
                    ["5", 40],
                    ["1.5", 999],
                ],
            );
        });

        it("splice, either backing", () => {
            const fromArray = new Collection(nums());
            const fromObject = new Collection(numsObj());

            agree(fromArray.splice(1, 2).all(), fromObject.splice(1, 2).all(), [
                ["0", 20],
                ["1", 30],
            ]);
            agree(fromArray.all(), fromObject.all(), [
                ["0", 10],
                ["1", 40],
            ]);
        });

        it("slice, either backing", () => {
            // collect([10,20,30,40])->slice(1,2) -> {1:20,2:30}.
            agree(
                new Collection(nums()).slice(1, 2).all(),
                new Collection(numsObj()).slice(1, 2).all(),
                [
                    ["0", 20],
                    ["1", 30],
                ],
                [
                    ["1", 20],
                    ["2", 30],
                ],
            );
        });

        it("filter, either backing", () => {
            // collect([10,20,30,40])->filter(fn($v)=>$v>15) -> {1:20,2:30,3:40}.
            const above15 = (value: number) => value > 15;

            agree(
                new Collection(nums()).filter(above15).all(),
                new Collection(numsObj()).filter(above15).all(),
                [
                    ["0", 20],
                    ["1", 30],
                    ["2", 40],
                ],
                [
                    ["1", 20],
                    ["2", 30],
                    ["3", 40],
                ],
            );
        });

        it("combine, either backing", () => {
            agree(
                new Collection(["a", "b", "c"]).combine([1, 2, 3]).all(),
                new Collection({ 0: "a", 1: "b", 2: "c" })
                    .combine({ 0: 1, 1: 2, 2: 3 })
                    .all(),
                [
                    ["a", 1],
                    ["b", 2],
                    ["c", 3],
                ],
            );
        });

        it("replace and replaceRecursive, either backing", () => {
            // array_replace(['a','b','c'],[1=>'d']) -> ['a','d','c'].
            agree(
                new Collection(["a", "b", "c"]).replace({ 1: "d" }).all(),
                new Collection({ 0: "a", 1: "b", 2: "c" })
                    .replace({ 1: "d" })
                    .all(),
                [
                    ["0", "a"],
                    ["1", "d"],
                    ["2", "c"],
                ],
            );
            agree(
                new Collection([{ a: 1 }, { b: 2 }])
                    .replaceRecursive([{ c: 3 }])
                    .all(),
                new Collection({ 0: { a: 1 }, 1: { b: 2 } })
                    .replaceRecursive({ 0: { c: 3 } })
                    .all(),
                [
                    ["0", { a: 1, c: 3 }],
                    ["1", { b: 2 }],
                ],
            );
        });

        it("diff and the diff*Using variants, either backing", () => {
            const same = (a: PropertyKey, b: PropertyKey) => a === b;

            agree(
                new Collection(nums()).diff([20, 40]).all(),
                new Collection(numsObj()).diff({ 0: 20, 1: 40 }).all(),
                [
                    ["0", 10],
                    ["1", 30],
                ],
                [
                    ["0", 10],
                    ["2", 30],
                ],
            );
            agree(
                new Collection(nums())
                    .diffAssocUsing([10, 999, 30, 40], same)
                    .all(),
                new Collection(numsObj())
                    .diffAssocUsing({ 0: 10, 1: 999, 2: 30, 3: 40 }, same)
                    .all(),
                [["0", 20]],
                [["1", 20]],
            );
            agree(
                new Collection(nums())
                    .diffKeysUsing(Object.assign([], { 1: "x", 3: "y" }), same)
                    .all(),
                new Collection(numsObj())
                    .diffKeysUsing({ 1: "x", 3: "y" }, same)
                    .all(),
                [
                    ["0", 10],
                    ["1", 30],
                ],
                [
                    ["0", 10],
                    ["2", 30],
                ],
            );
        });

        it("the intersect family, either backing", () => {
            const same = (a: PropertyKey, b: PropertyKey) => a === b;
            const sparse = Object.assign([] as unknown[], { 1: "x", 3: "y" });

            agree(
                new Collection(nums()).intersect([20, 40]).all(),
                new Collection(numsObj()).intersect({ 0: 20, 1: 40 }).all(),
                [
                    ["0", 20],
                    ["1", 40],
                ],
                [
                    ["1", 20],
                    ["3", 40],
                ],
            );
            agree(
                new Collection(nums()).intersectAssoc([10, 999, 30]).all(),
                new Collection(numsObj())
                    .intersectAssoc({ 0: 10, 1: 999, 2: 30 })
                    .all(),
                [
                    ["0", 10],
                    ["1", 30],
                ],
                [
                    ["0", 10],
                    ["2", 30],
                ],
            );
            agree(
                new Collection(nums())
                    .intersectAssocUsing([10, 999, 30], same)
                    .all(),
                new Collection(numsObj())
                    .intersectAssocUsing({ 0: 10, 1: 999, 2: 30 }, same)
                    .all(),
                [
                    ["0", 10],
                    ["1", 30],
                ],
                [
                    ["0", 10],
                    ["2", 30],
                ],
            );
            agree(
                new Collection(nums()).intersectByKeys(sparse).all(),
                new Collection(numsObj())
                    .intersectByKeys({ 1: "x", 3: "y" })
                    .all(),
                [
                    ["0", 20],
                    ["1", 40],
                ],
                [
                    ["1", 20],
                    ["3", 40],
                ],
            );
        });

        it("union, either backing", () => {
            // collect([10,20])->union([1,1,50,60]) -> [10,20,50,60].
            agree(
                new Collection([10, 20]).union([1, 1, 50, 60]).all(),
                new Collection({ 0: 10, 1: 20 })
                    .union({ 0: 1, 1: 1, 2: 50, 3: 60 })
                    .all(),
                [
                    ["0", 10],
                    ["1", 20],
                    ["2", 50],
                    ["3", 60],
                ],
            );
        });

        it("pad in both directions, either backing", () => {
            // collect([10,20,30,40])->pad(6,0) -> [10,20,30,40,0,0]; ->pad(-6,0) ->
            // [0,0,10,20,30,40]. Positive padding used to overwrite the first two
            // entries on the object backing, which is why this row now runs both signs.
            agree(
                new Collection(nums()).pad(6, 0).all(),
                new Collection(numsObj()).pad(6, 0).all(),
                [
                    ["0", 10],
                    ["1", 20],
                    ["2", 30],
                    ["3", 40],
                    ["4", 0],
                    ["5", 0],
                ],
            );
            agree(
                new Collection(nums()).pad(-6, 0).all(),
                new Collection(numsObj()).pad(-6, 0).all(),
                [
                    ["0", 0],
                    ["1", 0],
                    ["2", 10],
                    ["3", 20],
                    ["4", 30],
                    ["5", 40],
                ],
            );
        });

        it("keys and values, either backing", () => {
            agree(
                new Collection(nums()).keys().all(),
                new Collection(numsObj()).keys().all(),
                [
                    ["0", 0],
                    ["1", 1],
                    ["2", 2],
                    ["3", 3],
                ],
            );
            agree(
                new Collection(nums()).values().all(),
                new Collection(numsObj()).values().all(),
                numsEntries,
            );
        });

        it("reverse, either backing", () => {
            // collect([10,20,30,40])->reverse() iterates 40,30,20,10.
            agree(
                new Collection(nums()).reverse().all(),
                new Collection(numsObj()).reverse().all(),
                [
                    ["0", 40],
                    ["1", 30],
                    ["2", 20],
                    ["3", 10],
                ],
            );
        });

        it("random, either backing", () => {
            // No value pin: random is non-deterministic by design. Its keys
            // are the deterministic part.
            const fromArray = new Collection(nums());
            const fromObject = new Collection(numsObj());

            expect(nums()).toContain(fromArray.random());
            expect(nums()).toContain(fromObject.random());
            expect(Object.keys(fromArray.random(2).all())).toEqual(["0", "1"]);
            expect(Object.keys(fromObject.random(2).all())).toEqual(["0", "1"]);
        });

        it("only, either backing", () => {
            // collect([10,20,30,40])->only([1,3]) -> {1:20,3:40}.
            agree(
                new Collection(nums()).only(1, 3).all(),
                new Collection(numsObj()).only(1, 3).all(),
                [
                    ["0", 20],
                    ["1", 40],
                ],
                [
                    ["1", 20],
                    ["3", 40],
                ],
            );
        });

        it("flatten, either backing (Collection's own implementation)", () => {
            // Arr::flatten([1,[2,[3]]]) -> [1,2,3]; at depth 1 -> [1,2,[3]].
            const nested = [1, [2, [3]]];
            const nestedObj = { 0: 1, 1: { 0: 2, 1: { 0: 3 } } };

            agree(
                new Collection(nested).flatten().all(),
                new Collection(nestedObj).flatten().all(),
                [
                    ["0", 1],
                    ["1", 2],
                    ["2", 3],
                ],
            );
            expect(entriesOf(new Collection(nested).flatten(1).all())).toEqual([
                ["0", 1],
                ["1", 2],
                ["2", [3]],
            ]);
            expect(
                entriesOf(new Collection(nestedObj).flatten(1).all()),
            ).toEqual([
                ["0", 1],
                ["1", 2],
                ["2", { 0: 3 }],
            ]);
        });

        it("mapWithKeys, either backing (Collection's own implementation)", () => {
            // Arr::mapWithKeys(records, fn -> [name => id]) -> {c:3,a:1,b:2};
            // keying by id instead gives {3:'c',1:'a',2:'b'}, which JS
            // hoists ascending — the pairs are the same either way.
            const byName = (item: { id: number; name: string }) => ({
                [item.name]: item.id,
            });
            const byId = (item: { id: number; name: string }) => ({
                [item.id]: item.name,
            });

            agree(
                new Collection(records()).mapWithKeys(byName).all(),
                new Collection(recordsObj()).mapWithKeys(byName).all(),
                [
                    ["c", 3],
                    ["a", 1],
                    ["b", 2],
                ],
            );
            agree(
                new Collection(records()).mapWithKeys(byId).all(),
                new Collection(recordsObj()).mapWithKeys(byId).all(),
                [
                    ["1", "a"],
                    ["2", "b"],
                    ["3", "c"],
                ],
            );
        });

        it("get and has, either backing", () => {
            // docs/php-parity/task-26-collection-order.json, "get-dot-path-is-a-literal-key"
            expect(new Collection({ a: { b: 1 } }).get("a.b", "fallback")).toBe(
                "fallback",
            );

            // docs/php-parity/task-26-collection-order.json, "has-dot-path-is-a-literal-key"
            expect(new Collection({ a: { b: 1 } }).has("a.b")).toBe(false);

            // docs/php-parity/task-26-collection-order.json, "getOrPut-dot-path-is-a-literal-key"
            const nested = new Collection({ a: { b: 1 } });
            expect(nested.getOrPut("a.b", 9)).toBe(9);
            expect(nested.all()).toEqual({ a: { b: 1 }, "a.b": 9 });

            expect(new Collection(nums()).get(2)).toBe(30);
            expect(new Collection(numsObj()).get(2)).toBe(30);
            expect(new Collection(nums()).get(99, "default")).toBe("default");
            expect(new Collection(numsObj()).get(99, "default")).toBe(
                "default",
            );
            expect(new Collection(nums()).has(2)).toBe(true);
            expect(new Collection(numsObj()).has(2)).toBe(true);
            expect(new Collection(nums()).has(99)).toBe(false);
            expect(new Collection(numsObj()).has(99)).toBe(false);
        });

        it("pull, either backing (Collection's own implementation)", () => {
            // collect([10,20,30,40])->pull(1) -> 20, leaving {0:10,2:30,3:40}: the record keeps those keys,
            // and a list backing reindexes where PHP keeps a gap ("C32-B-pull-string-index-on-list").
            const fromArray = new Collection(nums());
            const fromObject = new Collection(numsObj());

            expect(fromArray.pull(1)).toBe(20);
            expect(fromObject.pull(1)).toBe(20);
            agree(
                fromArray.all(),
                fromObject.all(),
                [
                    ["0", 10],
                    ["1", 30],
                    ["2", 40],
                ],
                [
                    ["0", 10],
                    ["2", 30],
                    ["3", 40],
                ],
            );
        });

        it("undot, a list given dotted keys by put and the record it becomes", () => {
            // Arr::undot(['0'=>'a','1.0'=>'b','1.1'=>'c']) -> ['a',['b','c']].
            // A list cannot hold a dotted key, so put rebuilds it as keyed; both halves then undot the same record.
            const keyedList = new Collection(["a"])
                .put("1.0", "b")
                .put("1.1", "c");
            const record = { "0": "a", "1.0": "b", "1.1": "c" };

            agree(
                keyedList.undot().all(),
                new Collection(record).undot().all(),
                [
                    ["0", "a"],
                    ["1", ["b", "c"]],
                ],
            );
        });

        it("pluck, either backing", () => {
            agree(
                new Collection(records()).pluck("name").all(),
                new Collection(recordsObj()).pluck("name").all(),
                [
                    ["0", "c"],
                    ["1", "a"],
                    ["2", "b"],
                ],
            );
        });

        it("sort and sortDesc, either backing", () => {
            // A negative alongside a zero is what makes this row non-vacuous. PHP, in
            // "sort orders falsy values by value, not by falsiness": asort(['a'=>-1,
            // 'b'=>0,'c'=>5]) -> {"a":-1,"b":0,"c":5}; arsort -> {"c":5,"b":0,"a":-1}.
            agree(
                new Collection([5, -1, 0]).sort().all(),
                new Collection({ a: -1, b: 0, c: 5 }).sort().all(),
                [
                    ["0", -1],
                    ["1", 0],
                    ["2", 5],
                ],
                [
                    ["a", -1],
                    ["b", 0],
                    ["c", 5],
                ],
            );

            agree(
                new Collection([5, -1, 0]).sortDesc().all(),
                new Collection({ a: -1, b: 0, c: 5 }).sortDesc().all(),
                [
                    ["0", 5],
                    ["1", 0],
                    ["2", -1],
                ],
                [
                    ["c", 5],
                    ["b", 0],
                    ["a", -1],
                ],
            );

            // An all-integer-keyed object now reorders too: the keys are renumbered over
            // the sorted sequence rather than preserved, so the order survives the write.
            // PHP keeps the names (sort_all {"1":1,"2":2,"0":3}) but the same value order.
            agree(
                new Collection([30, 10, 20]).sort().all(),
                new Collection({ 0: 30, 1: 10, 2: 20 }).sort().all(),
                [
                    ["0", 10],
                    ["1", 20],
                    ["2", 30],
                ],
            );
        });

        it("sortBy with no comparisons leaves the order alone, either backing", () => {
            // collect([3,1,2])->sortBy([]) -> [3,1,2].
            agree(
                new Collection([3, 1, 2]).sortBy([]).all(),
                new Collection({ 0: 3, 1: 1, 2: 2 }).sortBy([]).all(),
                [
                    ["0", 3],
                    ["1", 1],
                    ["2", 2],
                ],
            );
        });
    });

    describe("item paths read like data_get", () => {
        /** The rows as a list, or keyed "x", "y" and "z" in order. */
        const backed = (keyed: boolean, rows: unknown[]) =>
            keyed
                ? collect(
                      Object.fromEntries(
                          rows.map((row, index) => [
                              ["x", "y", "z"][index],
                              row,
                          ]),
                      ),
                  )
                : collect(rows);

        /** Three Collection rows, "k" => b, a, b and "v" => 1, 2, 3, as a list or keyed "x", "y" and "z". */
        const collectionRows = (keyed: boolean) =>
            backed(keyed, [
                collect({ k: "b", v: 1 }),
                collect({ k: "a", v: 2 }),
                collect({ k: "b", v: 3 }),
            ]) as Collection<Collection<string | number, string>, PropertyKey>;

        it.each([
            [
                "where reads a dot path through the item, never a literal dotted key",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-item-paths-filtered-values"
                (keyed: boolean) =>
                    backed(keyed, [
                        { a: { b: 1 } },
                        { a: { b: 2 } },
                        { "a.b": 2 },
                    ])
                        .where("a.b", 2)
                        .values()
                        .all(),
                { list: [{ a: { b: 2 } }], keyed: [{ a: { b: 2 } }] },
            ],
            [
                "where expands a wildcard in the path",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-item-paths-filtered-values"
                (keyed: boolean) =>
                    backed(keyed, [
                        { a: [{ b: 1 }, { b: 2 }] },
                        { a: [{ b: 3 }] },
                    ])
                        .where("a.*.b", [1, 2])
                        .values()
                        .all(),
                {
                    list: [{ a: [{ b: 1 }, { b: 2 }] }],
                    keyed: [{ a: [{ b: 1 }, { b: 2 }] }],
                },
            ],
            [
                "pluck reads a dot path through the item, never a literal dotted key",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-item-paths-by-backing"
                (keyed: boolean) =>
                    backed(keyed, [{ "a.b": 1, a: { b: 2 } }])
                        .pluck("a.b")
                        .all(),
                { list: [2], keyed: [2] },
            ],
            [
                "value reads a dot path through the item, never a literal dotted key",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-item-paths-by-backing" and
                // "C32-D-data-get-literal-dotted-key"
                (keyed: boolean) =>
                    backed(keyed, [{ "a.b": 1, a: { b: 2 } }]).value("a.b"),
                { list: 2, keyed: 2 },
            ],
            [
                "value finds no item for a path that only a literal dotted key would match",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-item-paths-by-backing" and
                // "C32-D-data-get-literal-dotted-key"
                (keyed: boolean) =>
                    backed(keyed, [{ "a.b": 1 }]).value("a.b", "miss"),
                { list: "miss", keyed: "miss" },
            ],
            [
                "keyBy reads an array path one segment at a time",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-item-paths-by-backing" and
                // "C32-E-keyBy-array-path"
                (keyed: boolean) =>
                    backed(keyed, [{ a: { b: "z" } }])
                        .keyBy(["a", "b"])
                        .keys()
                        .all(),
                { list: ["z"], keyed: ["z"] },
            ],
            [
                "keyBy keys an array path that reaches no value under the empty string",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-item-paths-by-backing" and
                // "C32-E-keyBy-array-path"
                (keyed: boolean) =>
                    backed(keyed, [{ id: 1, name: "John" }])
                        .keyBy(["id", "name"])
                        .keys()
                        .all(),
                { list: [""], keyed: [""] },
            ],
        ] as [
            string,
            (keyed: boolean) => unknown,
            { list: unknown; keyed: unknown },
        ][])("%s", (_name, run, expected) => {
            expect(run(false)).toEqual(expected.list);
            expect(run(true)).toEqual(expected.keyed);
        });

        it.each([
            [
                "contains reads a path through Collection rows",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-collection-rows-by-backing"
                (keyed: boolean) => collectionRows(keyed).contains("k", "a"),
                { list: true, keyed: true },
            ],
            [
                "where reads a path through Collection rows",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-item-paths-filtered-values"
                (keyed: boolean) =>
                    collectionRows(keyed).where("k", "b").pluck("v").all(),
                { list: [1, 3], keyed: [1, 3] },
            ],
            [
                "firstWhere reads a path through Collection rows",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-collection-rows-by-backing"
                (keyed: boolean) =>
                    collectionRows(keyed).firstWhere("k", "a")?.all(),
                { list: { k: "a", v: 2 }, keyed: { k: "a", v: 2 } },
            ],
            [
                "value reads a path through Collection rows",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-collection-rows-by-backing"
                (keyed: boolean) => collectionRows(keyed).value("v"),
                { list: 1, keyed: 1 },
            ],
            [
                "pluck reads a path through Collection rows",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-pluck-collection-rows"
                (keyed: boolean) => [
                    collectionRows(keyed).pluck("v").all(),
                    collectionRows(keyed).pluck("v", "k").all(),
                ],
                {
                    list: [[1, 2, 3], { b: 3, a: 2 }],
                    keyed: [[1, 2, 3], { b: 3, a: 2 }],
                },
            ],
            [
                "sortBy reads a path through Collection rows",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortBy-collection-rows"
                (keyed: boolean) =>
                    collectionRows(keyed).sortBy("k").pluck("v").all(),
                { list: [2, 1, 3], keyed: [2, 1, 3] },
            ],
            [
                "sortBy reads each descriptor's path through Collection rows",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortBy-descriptors-collection-rows"
                (keyed: boolean) =>
                    collectionRows(keyed)
                        .sortBy([
                            ["k", "asc"],
                            ["v", "desc"],
                        ])
                        .pluck("v")
                        .all(),
                { list: [2, 3, 1], keyed: [2, 3, 1] },
            ],
            [
                "groupBy reads a path through Collection rows",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-groupBy-collection-rows"
                (keyed: boolean) =>
                    collectionRows(keyed)
                        .groupBy("k")
                        .map((group) => collect(group).pluck("v").all())
                        .all(),
                { list: { b: [1, 3], a: [2] }, keyed: { b: [1, 3], a: [2] } },
            ],
            [
                "keyBy reads a path through Collection rows",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-keyBy-collection-rows"
                (keyed: boolean) =>
                    collectionRows(keyed)
                        .keyBy("k")
                        .map((row) => row.offsetGet("v"))
                        .all(),
                { list: { b: 3, a: 2 }, keyed: { b: 3, a: 2 } },
            ],
            [
                "unique reads a path through Collection rows",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-unique-collection-rows"
                (keyed: boolean) => [
                    collectionRows(keyed).unique("k").keys().all(),
                    collectionRows(keyed).unique("k").pluck("v").all(),
                ],
                {
                    list: [
                        [0, 1],
                        [1, 2],
                    ],
                    keyed: [
                        ["x", "y"],
                        [1, 2],
                    ],
                },
            ],
            [
                "duplicates reads a path through Collection rows",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-duplicates-collection-rows"
                (keyed: boolean) => [
                    collectionRows(keyed).duplicates("k").keys().all(),
                    collectionRows(keyed).duplicates("k").values().all(),
                ],
                { list: [[2], ["b"]], keyed: [["z"], ["b"]] },
            ],
            [
                "partition reads a path through Collection rows",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-partition-collection-rows"
                (keyed: boolean) =>
                    collectionRows(keyed)
                        .partition("k", "b")
                        .all()
                        .map((half) => half.pluck("v").all()),
                { list: [[1, 3], [2]], keyed: [[1, 3], [2]] },
            ],
            [
                "whereIn, whereNotIn and whereNotBetween read a path through Collection rows",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-item-paths-filtered-values"
                (keyed: boolean) => [
                    collectionRows(keyed).whereIn("k", ["a"]).pluck("v").all(),
                    collectionRows(keyed)
                        .whereNotIn("k", ["a"])
                        .pluck("v")
                        .all(),
                    collectionRows(keyed)
                        .whereNotBetween("v", [2, 2])
                        .pluck("v")
                        .all(),
                ],
                {
                    list: [[2], [1, 3], [1, 3]],
                    keyed: [[2], [1, 3], [1, 3]],
                },
            ],
            [
                "containsStrict reads a path through Collection rows",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-where-in-collection-rows"
                (keyed: boolean) =>
                    collectionRows(keyed).containsStrict("k", "a"),
                { list: true, keyed: true },
            ],
            [
                "implode reads a path through Collection rows",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-implode-collection-rows-by-backing"
                (keyed: boolean) => collectionRows(keyed).implode("k", ","),
                { list: "b,a,b", keyed: "b,a,b" },
            ],
        ] as [
            string,
            (keyed: boolean) => unknown,
            { list: unknown; keyed: unknown },
        ][])("%s", (_name, run, expected) => {
            expect(run(false)).toEqual(expected.list);
            expect(run(true)).toEqual(expected.keyed);
        });

        /** The same three rows as Maps, which stand for the PHP arrays of C32-D-array-rows-by-backing. */
        const mapRows = (keyed: boolean) =>
            backed(keyed, [
                new Map<string, string | number>([
                    ["k", "b"],
                    ["v", 1],
                ]),
                new Map<string, string | number>([
                    ["k", "a"],
                    ["v", 2],
                ]),
                new Map<string, string | number>([
                    ["k", "b"],
                    ["v", 3],
                ]),
            ]) as Collection<Map<string, string | number>, PropertyKey>;

        it.each([
            [
                "contains",
                (keyed: boolean) => mapRows(keyed).contains("k", "a"),
                true,
            ],
            [
                "where",
                (keyed: boolean) =>
                    mapRows(keyed).where("k", "b").pluck("v").all(),
                [1, 3],
            ],
            [
                "firstWhere",
                (keyed: boolean) => {
                    const row = mapRows(keyed).firstWhere("k", "a");

                    return row && Object.fromEntries(row);
                },
                { k: "a", v: 2 },
            ],
            ["value", (keyed: boolean) => mapRows(keyed).value("v"), 1],
            [
                "pluck",
                (keyed: boolean) => [
                    mapRows(keyed).pluck("v").all(),
                    mapRows(keyed).pluck("v", "k").all(),
                ],
                [[1, 2, 3], { b: 3, a: 2 }],
            ],
            [
                "sortBy",
                (keyed: boolean) => mapRows(keyed).sortBy("k").pluck("v").all(),
                [2, 1, 3],
            ],
            [
                "groupBy",
                (keyed: boolean) =>
                    mapRows(keyed)
                        .groupBy("k")
                        .map((group) => collect(group).pluck("v").all())
                        .all(),
                { b: [1, 3], a: [2] },
            ],
            [
                "keyBy",
                (keyed: boolean) =>
                    mapRows(keyed)
                        .keyBy("k")
                        .map((row) => row.get("v"))
                        .all(),
                { b: 3, a: 2 },
            ],
            [
                "whereIn",
                (keyed: boolean) =>
                    mapRows(keyed).whereIn("k", ["a"]).pluck("v").all(),
                [2],
            ],
        ] as [string, (keyed: boolean) => unknown, unknown][])(
            "%s reads a path through Map rows, as through the arrays they stand for",
            (_method, run, expected) => {
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-array-rows-by-backing"
                expect(run(false)).toEqual(expected);
                expect(run(true)).toEqual(expected);
            },
        );

        it("reads a single Collection row through contains, where, firstWhere and value", () => {
            const rows = () => collect([collect({ v: 1 })]);

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-collection-rows"
            expect([
                rows().contains("v", 1),
                rows().where("v", 1).count(),
                rows().firstWhere("v", 1)?.all(),
                rows().value("v"),
            ]).toEqual([true, 1, { v: 1 }, 1]);
        });

        it("plucks a key out of Collection rows", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-pluck-nested-collections"
            expect(
                collect([collect({ a: 1 }), collect({ a: 2 })])
                    .pluck("a")
                    .all(),
            ).toEqual([1, 2]);
        });

        it("where keeps the key of each item a path matches", () => {
            // A record holding a list's own keys keeps them, where a list backing reindexes after a removal.
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-where-dot-path"
            expect(
                collect({
                    0: { a: { b: 1 } },
                    1: { a: { b: 2 } },
                    2: { "a.b": 2 },
                })
                    .where("a.b", 2)
                    .keys()
                    .all(),
            ).toEqual([1]);
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-where-wildcard-path"
            expect(
                collect({
                    0: { a: [{ b: 1 }, { b: 2 }] },
                    1: { a: [{ b: 3 }] },
                })
                    .where("a.*.b", [1, 2])
                    .keys()
                    .all(),
            ).toEqual([0]);
        });

        it("reads the item itself for a null path", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-whereIn-null-key"
            expect(
                collect([1, 2, 3]).whereIn(null, [1, 3]).values().all(),
            ).toEqual([1, 3]);
        });

        it("takes the first Collection row that holds the key, even when it holds null", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-value-collection-row-null"
            expect(
                collect([collect({ v: null }), collect({ v: 1 })]).value(
                    "v",
                    "def",
                ),
            ).toBeNull();
        });
    });

    describe("callbacks receive PHP's integer keys", () => {
        /** The keys a method hands its callback over ["a", "b"] and over { 1: "a", x: "b" }, in order. */
        const keysSeen = (
            run: (
                collection: Collection<string, PropertyKey>,
                note: (key: PropertyKey) => void,
            ) => void,
        ): PropertyKey[][] =>
            [collect(["a", "b"]), collect({ 1: "a", x: "b" })].map(
                (collection) => {
                    const seen: PropertyKey[] = [];

                    run(
                        collection as unknown as Collection<
                            string,
                            PropertyKey
                        >,
                        (key) => {
                            seen.push(key);
                        },
                    );

                    return seen;
                },
            );

        it.each([
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-every-callback-key-types"
                "every",
                (
                    collection: Collection<string, PropertyKey>,
                    note: (key: PropertyKey) => void,
                ) => {
                    collection.every((_value, key) => {
                        note(key);

                        return true;
                    });
                },
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-each-mixed-keys"
                "each",
                (
                    collection: Collection<string, PropertyKey>,
                    note: (key: PropertyKey) => void,
                ) => {
                    collection.each((_value, key) => {
                        note(key);
                    });
                },
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-groupBy-callback-key-type"
                "groupBy",
                (
                    collection: Collection<string, PropertyKey>,
                    note: (key: PropertyKey) => void,
                ) => {
                    collection.groupBy((_value, key) => {
                        note(key);

                        return "g";
                    });
                },
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-countBy-callback-key-type"
                "countBy",
                (
                    collection: Collection<string, PropertyKey>,
                    note: (key: PropertyKey) => void,
                ) => {
                    collection.countBy((_value, key) => {
                        note(key);

                        return "g";
                    });
                },
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortBy-callback-key-types-list"
                // and "C32-G-sortBy-callback-key-types-int-keys"
                "sortBy",
                (
                    collection: Collection<string, PropertyKey>,
                    note: (key: PropertyKey) => void,
                ) => {
                    collection.sortBy((value, key) => {
                        note(key);

                        return value;
                    });
                },
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-reduceSpread-list-key-type"
                "reduceSpread",
                (
                    collection: Collection<string, PropertyKey>,
                    note: (key: PropertyKey) => void,
                ) => {
                    collection.reduceSpread((carry, _value, key) => {
                        note(key);

                        return [carry];
                    }, null);
                },
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-mapWithKeys-callback-key-type"
                "mapWithKeys",
                (
                    collection: Collection<string, PropertyKey>,
                    note: (key: PropertyKey) => void,
                ) => {
                    collection.mapWithKeys((value, key) => {
                        note(key);

                        return { [value]: value };
                    });
                },
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-keyBy-callback-key-type"
                "keyBy",
                (
                    collection: Collection<string, PropertyKey>,
                    note: (key: PropertyKey) => void,
                ) => {
                    collection.keyBy((value, key) => {
                        note(key);

                        return value;
                    });
                },
            ],
        ])("%s hands its callback PHP's integer keys", (_method, run) => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-callback-key-types-sweep"
            expect(keysSeen(run)).toEqual([
                [0, 1],
                [1, "x"],
            ]);
        });

        it("sortKeysUsing compares PHP's integer keys", () => {
            const compared = keysSeen((collection, note) => {
                collection.sortKeysUsing((a, b) => {
                    note(a);
                    note(b);

                    return String(a).localeCompare(String(b));
                });
            });

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortKeysUsing-key-types" and
            // "C32-E-callback-key-types-sweep", which list the distinct keys compared, sorted
            expect(
                compared.map((keys) =>
                    [...new Set(keys)].sort((a, b) =>
                        String(a).localeCompare(String(b)),
                    ),
                ),
            ).toEqual([
                [0, 1],
                [1, "x"],
            ]);
        });

        it("containsStrict, search, hasSole, sole and firstOrFail hand their callbacks PHP's integer keys", () => {
            const collection = collect({ 1: "a", x: "b" });
            const keysSeen = (
                run: (
                    callback: (value: string, key: PropertyKey) => boolean,
                ) => void,
            ): PropertyKey[] => {
                const keys: PropertyKey[] = [];

                run((_value, key) => {
                    keys.push(key);

                    return false;
                });

                return keys;
            };

            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-C-callback-key-types-numeric-string-record"
            expect({
                containsStrict: keysSeen((callback) => {
                    collection.containsStrict(callback);
                }),
                search: keysSeen((callback) => {
                    collection.search(callback);
                }),
                hasSole: keysSeen((callback) => {
                    collection.hasSole(callback);
                }),
                sole: keysSeen((callback) => {
                    expect(() => collection.sole(callback)).toThrow(
                        ItemNotFoundException,
                    );
                }),
                firstOrFail: keysSeen((callback) => {
                    expect(() => collection.firstOrFail(callback)).toThrow(
                        ItemNotFoundException,
                    );
                }),
            }).toEqual({
                containsStrict: [1, "x"],
                search: [1, "x"],
                hasSole: [1, "x"],
                sole: [1, "x"],
                firstOrFail: [1, "x"],
            });
        });

        it("each hands its callback an integer key for an array or object item too", () => {
            const seen: PropertyKey[] = [];

            collect([{ a: 1 }, { b: 2 }]).each((_value, key) => {
                seen.push(key);
            });
            collect({ 5: { a: 1 } }).each((_value, key) => {
                seen.push(key);
            });

            // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-each-key-type-array-items"
            expect(seen).toEqual([0, 1, 5]);
        });
    });

    describe("computed keys follow PHP's array-key rules", () => {
        /** An object with its own toString, as PHP's anonymous class with a __toString. */
        const framework = () =>
            new (class {
                toString(): string {
                    return "Framework";
                }
            })();

        it.each([
            [
                "keyBy casts a Stringable or an object with its own toString to its string",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-keyBy-stringable-keys"
                () => [
                    collect([1]).keyBy(framework).keys().all(),
                    collect([1])
                        .keyBy(() => new Stringable("Lara"))
                        .keys()
                        .all(),
                ],
                [["Framework"], ["Lara"]],
            ],
            [
                "groupBy truncates a float key",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-groupBy-float-key"
                () =>
                    collect([1, 2])
                        .groupBy(() => 1.5)
                        .toArray(),
                { 1: [1, 2] },
            ],
            [
                "groupBy files an item under each value of a plain object it returns",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-groupBy-assoc-return"
                () =>
                    collect([1, 2])
                        .groupBy((x) => ({ p: x, q: "z" }))
                        .toArray(),
                { 1: [1], z: [1, 2], 2: [2] },
            ],
            [
                "countBy truncates a float",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-countBy-float"
                () => collect([1.5, 1.7, 2.5]).countBy().all(),
                { 1: 2, 2: 1 },
            ],
            [
                "pluck casts a key closure's bool or float result",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-pluck-key-closure-casts"
                () => [
                    collect([{ v: "x" }, { v: "y" }])
                        .pluck("v", (row) => row.v === "x")
                        .all(),
                    collect([{ v: "x" }])
                        .pluck("v", () => 1.5)
                        .all(),
                ],
                [{ 1: "x", 0: "y" }, { 1: "x" }],
            ],
            [
                "pluck casts a key path's null, bool or float value",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-pluck-key-path-casts"
                () =>
                    collect([
                        { k: null, v: "n" },
                        { k: true, v: "t" },
                        { k: false, v: "f" },
                        { k: 1.5, v: "fl" },
                    ])
                        .pluck("v", "k")
                        .all(),
                { "": "n", 1: "fl", 0: "f" },
            ],
            [
                "pluck casts a Stringable or an object with its own toString to its string",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-pluck-stringable-key" and
                // "C32-E-pluck-tostring-key"
                () => [
                    collect([{ v: 1 }])
                        .pluck("v", () => new Stringable("Lara"))
                        .all(),
                    collect([{ v: 1 }])
                        .pluck("v", framework)
                        .all(),
                ],
                [{ Lara: 1 }, { Framework: 1 }],
            ],
            [
                "pluck keys by a unit enum case's name",
                // JS-only: a unit enum case is its name, a plain string, so pluck keys by it where PHP's case throws.
                () =>
                    collect([{ v: 1 }])
                        .pluck("v", () => TestEnum.A)
                        .all(),
                { A: 1 },
            ],
            [
                "mode counts a bool under the integer key PHP stores it as",
                // docs/php-parity/task-31-laravel-13-33-sync.json, "mode-bools"
                () => collect([true, true, false]).mode(),
                [1],
            ],
            [
                "mode truncates a float",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-mode-float-items"
                () => collect([1.5, 1.7, 2.5]).mode(),
                [1],
            ],
            [
                "mode counts a unit enum case by its name",
                // JS-only: a unit enum case is its name, a plain string, so mode counts it where PHP's case throws.
                () => collect([TestEnum.A, TestEnum.A, "z"]).mode(),
                ["A"],
            ],
        ] as [string, () => unknown, unknown][])(
            "%s",
            (_name, run, expected) => {
                expect(run()).toEqual(expected);
            },
        );

        it.each([
            [
                "keyBy throws an Error for an object without its own toString",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-keyBy-date-key": a JS Date
                // names its own class, where PHP's message names DateTime.
                () => collect([1]).keyBy(() => new Date(0)),
                new Error(
                    "Object of class Date could not be converted to string",
                ),
            ],
            [
                "groupBy throws for an array key among the keys it gets back",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-groupBy-nested-array-key"
                () => collect([1]).groupBy(() => [[1, 2]]),
                new TypeError(
                    "array_key_exists(): Argument #1 ($key) must be a valid array offset type",
                ),
            ],
            [
                "groupBy throws for a plain object key among the keys it gets back",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-groupBy-nested-assoc-key"
                () => collect([1]).groupBy(() => [{ a: 1 }]),
                new TypeError(
                    "array_key_exists(): Argument #1 ($key) must be a valid array offset type",
                ),
            ],
            [
                "groupBy throws for a Date key",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-groupBy-date-key"
                () => collect([1]).groupBy(() => new Date(0)),
                new TypeError(
                    "array_key_exists(): Argument #1 ($key) must be a valid array offset type",
                ),
            ],
            [
                "countBy throws for a Date",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-countBy-date-key": a JS Date
                // names its own class, where PHP's message names DateTime.
                () => collect([1]).countBy(() => new Date(0)),
                new TypeError(
                    "Cannot access offset of type Date in isset or empty",
                ),
            ],
            [
                "countBy throws for a Stringable, which it does not cast",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-countBy-stringable-key": the
                // message names the class as JS does, without PHP's Illuminate\Support namespace.
                () => collect([1]).countBy(() => new Stringable("Lara")),
                new TypeError(
                    "Cannot access offset of type Stringable in isset or empty",
                ),
            ],
            [
                "countBy throws for an object with its own toString, which it does not cast",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-countBy-tostring-key"
                () => collect([1]).countBy(framework),
                new TypeError(
                    "Cannot access offset of type class@anonymous in isset or empty",
                ),
            ],
            [
                "pluck throws for an array key",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-pluck-array-key"
                () => collect([{ v: 1 }]).pluck("v", () => [1, 2]),
                new TypeError("Cannot access offset of type array on array"),
            ],
            [
                "pluck throws for a plain object key",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-pluck-assoc-key"
                () => collect([{ v: 1 }]).pluck("v", () => ({ a: 1 })),
                new TypeError("Cannot access offset of type array on array"),
            ],
            [
                "pluck throws for a Date key",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-pluck-date-key": a JS Date
                // names its own class, where PHP's message names DateTime.
                () => collect([{ v: 1 }]).pluck("v", () => new Date(0)),
                new TypeError("Cannot access offset of type Date on array"),
            ],
            [
                "pluck throws for a closure key, which PHP names Closure",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-pluck-closure-key"
                () => collect([{ v: 1 }]).pluck("v", () => () => 1),
                new TypeError("Cannot access offset of type Closure on array"),
            ],
            [
                "pluck throws for an anonymous subclass's instance as a key, naming the class it extends",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-pluck-anonymous-subclass-key"
                () => {
                    class Parent {}

                    return collect([{ v: 1 }]).pluck(
                        "v",
                        () => new (class extends Parent {})(),
                    );
                },
                new TypeError(
                    "Cannot access offset of type Parent@anonymous on array",
                ),
            ],
            [
                "pluck throws for an enum case key, which it does not unwrap",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-pluck-enum-key": a case is a
                // plain object here, so the message names the array it models where PHP names the enum's class.
                () =>
                    collect([{ v: 1 }]).pluck("v", () =>
                        TestBackedEnum.from(2),
                    ),
                new TypeError("Cannot access offset of type array on array"),
            ],
            [
                "mode throws for array items",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-mode-array-items"
                () => collect([[1], [1]]).mode(),
                new TypeError(
                    "Cannot access offset of type array in isset or empty",
                ),
            ],
            [
                "mode throws for plain object items",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-mode-assoc-items"
                () => collect([{ a: 1 }, { a: 1 }]).mode(),
                new TypeError(
                    "Cannot access offset of type array in isset or empty",
                ),
            ],
            [
                "mode throws for Date items",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-mode-date-items": a JS Date
                // names its own class, where PHP's message names DateTime.
                () => collect([new Date(0), new Date(0)]).mode(),
                new TypeError(
                    "Cannot access offset of type Date in isset or empty",
                ),
            ],
            [
                "mode throws for enum case items, which it does not unwrap",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-mode-enum-items": a case is a
                // plain object here, so the message names the array it models where PHP names the enum's class.
                () =>
                    collect([
                        TestBackedEnum.from(2),
                        TestBackedEnum.from(2),
                    ]).mode(),
                new TypeError(
                    "Cannot access offset of type array in isset or empty",
                ),
            ],
            [
                "mode throws for Stringable items, which it does not cast",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-mode-stringable-items": the
                // message names the class as JS does, without PHP's Illuminate\Support namespace.
                () =>
                    collect([
                        new Stringable("Lara"),
                        new Stringable("Lara"),
                    ]).mode(),
                new TypeError(
                    "Cannot access offset of type Stringable in isset or empty",
                ),
            ],
            [
                "mode throws for items with their own toString, which it does not cast",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-H-mode-tostring-items"
                () => {
                    const item = framework();

                    return collect([item, item]).mode();
                },
                new TypeError(
                    "Cannot access offset of type class@anonymous in isset or empty",
                ),
            ],
        ] as [string, () => unknown, Error][])("%s", (_name, run, failure) => {
            expect(run).toThrow(failure);
        });

        /** The three views a keyed result pins: its entries, its keys in order and its values in order. */
        const views = <
            TValue,
            TKey extends PropertyKey,
            TShape extends CollectionShape,
        >(
            collection: Collection<TValue, TKey, TShape>,
        ) => ({
            all: collection.toArray(),
            keys: collection.keys().all(),
            values: collection.values().toArray(),
        });

        it.each([
            [
                "keyBy keeps the order its integer keys arrive in",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-keyBy-int-key-order"
                () => collect([{ id: 3 }, { id: 1 }, { id: 2 }]).keyBy("id"),
                {
                    all: { 3: { id: 3 }, 1: { id: 1 }, 2: { id: 2 } },
                    keys: [3, 1, 2],
                    values: [{ id: 3 }, { id: 1 }, { id: 2 }],
                },
            ],
            [
                "groupBy keeps the order its integer keys arrive in",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-groupBy-int-key-order"
                () => collect([{ r: 2 }, { r: 1 }, { r: 2 }]).groupBy("r"),
                {
                    all: { 2: [{ r: 2 }, { r: 2 }], 1: [{ r: 1 }] },
                    keys: [2, 1],
                    values: [[{ r: 2 }, { r: 2 }], [{ r: 1 }]],
                },
            ],
            [
                "groupBy keeps the order its bool keys arrive in",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-groupBy-bool-key-order"
                () =>
                    collect([{ a: true }, { a: false }, { a: true }]).groupBy(
                        "a",
                    ),
                {
                    all: { 1: [{ a: true }, { a: true }], 0: [{ a: false }] },
                    keys: [1, 0],
                    values: [[{ a: true }, { a: true }], [{ a: false }]],
                },
            ],
            [
                "countBy keeps the order its integer keys arrive in",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-countBy-int-key-order"
                () => collect([3, 1, 3]).countBy(),
                { all: { 3: 2, 1: 1 }, keys: [3, 1], values: [2, 1] },
            ],
            [
                "pluck keeps the order its integer keys arrive in",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-pluck-int-key-order"
                () =>
                    collect([
                        { id: 3, n: "c" },
                        { id: 1, n: "a" },
                        { id: 2, n: "b" },
                    ]).pluck("n", "id"),
                {
                    all: { 3: "c", 1: "a", 2: "b" },
                    keys: [3, 1, 2],
                    values: ["c", "a", "b"],
                },
            ],
            [
                "mapToDictionary keeps the order its integer keys arrive in",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-mapToDictionary-int-key-order"
                () =>
                    collect([3, 1, 3, 2]).mapToDictionary((value, key) => ({
                        [value]: key,
                    })),
                {
                    all: { 3: [0, 2], 1: [1], 2: [3] },
                    keys: [3, 1, 2],
                    values: [[0, 2], [1], [3]],
                },
            ],
            [
                "mapToGroups keeps the order its integer keys arrive in",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-mapToGroups-int-key-order"
                () =>
                    collect([3, 1, 3]).mapToGroups((value, key) => ({
                        [value]: key,
                    })),
                {
                    all: { 3: [0, 2], 1: [1] },
                    keys: [3, 1],
                    values: [[0, 2], [1]],
                },
            ],
            [
                "flip keeps the order its integer keys arrive in",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-flip-int-key-order"
                () => collect({ x: 3, y: 1 }).flip(),
                { all: { 3: "x", 1: "y" }, keys: [3, 1], values: ["x", "y"] },
            ],
            [
                "flip keeps its order past the values it skips",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-flip-int-key-order"
                () =>
                    collect({
                        string: "taylor",
                        integer: 1,
                        null: null,
                        false: false,
                        true: true,
                        float: 1.5,
                        array: [],
                        object: {},
                    }).flip(),
                {
                    all: { taylor: "string", 1: "integer" },
                    keys: ["taylor", 1],
                    values: ["string", "integer"],
                },
            ],
            [
                "collapseWithKeys keeps the order its integer keys arrive in",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-collapseWithKeys-int-key-order"
                () =>
                    collect([
                        { 1: "a" },
                        { 3: "c" },
                        { 2: "b" },
                        "drop",
                    ]).collapseWithKeys(),
                {
                    all: { 1: "a", 3: "c", 2: "b" },
                    keys: [1, 3, 2],
                    values: ["a", "c", "b"],
                },
            ],
            [
                "combine keeps the order its integer keys arrive in",
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-F-combine-int-key-order"
                () => collect([3, 1, 2]).combine(["c", "a", "b"]),
                {
                    all: { 3: "c", 1: "a", 2: "b" },
                    keys: [3, 1, 2],
                    values: ["c", "a", "b"],
                },
            ],
        ] as [
            string,
            () => Collection<unknown, PropertyKey>,
            { all: unknown; keys: unknown; values: unknown },
        ][])("%s", (_name, run, expected) => {
            expect(views(run())).toEqual(expected);
        });

        it.each([
            [
                "groupBy",
                () =>
                    collect([{ k: "s" }, { k: 5 }])
                        .groupBy("k")
                        .keys()
                        .all(),
            ],
            ["countBy", () => collect(["s", 5]).countBy().keys().all()],
            [
                "keyBy",
                () =>
                    collect([{ k: "s" }, { k: 5 }])
                        .keyBy("k")
                        .keys()
                        .all(),
            ],
            [
                "pluck",
                () =>
                    collect([
                        { k: "s", v: 1 },
                        { k: 5, v: 2 },
                    ])
                        .pluck("v", "k")
                        .keys()
                        .all(),
            ],
            [
                "mapToDictionary",
                () =>
                    collect(["s", 5])
                        .mapToDictionary((value) => ({ [value]: value }))
                        .keys()
                        .all(),
            ],
            [
                "collapseWithKeys",
                () =>
                    collect([{ s: 1 }, { 5: 2 }])
                        .collapseWithKeys()
                        .keys()
                        .all(),
            ],
            ["flip", () => collect(["s", 5]).flip().keys().all()],
        ] as [string, () => PropertyKey[]][])(
            "%s keeps a string key produced before an integer key first",
            (_method, run) => {
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-keyed-results-mixed-key-order"
                expect(run()).toEqual(["s", 5]);
            },
        );

        it.each([
            [
                "mapWithKeys",
                () =>
                    collect<string>([]).mapWithKeys((value) => ({
                        [value]: value,
                    })),
            ],
            ["groupBy", () => collect<string>([]).groupBy("x")],
            ["countBy", () => collect<string>([]).countBy()],
            ["keyBy", () => collect<string>([]).keyBy("x")],
            ["flip", () => collect<string>([]).flip()],
        ] as [
            string,
            () => Collection<unknown, PropertyKey, CollectionShape>,
        ][])(
            "%s writes an empty result as PHP's empty array",
            (_method, run) => {
                const result = run();

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-E-keyed-results-empty"
                expect(result.toJson()).toBe("[]");
                expect(result.keys().all()).toEqual([]);
                expect(result.values().all()).toEqual([]);
                // JS-only: an empty keyed result keeps its record, which JSON writes as PHP's []
                expect(result.all()).toEqual({});
            },
        );

        it.each([
            [
                "keyBy",
                () =>
                    new Collection(
                        new Map([
                            [2, { id: 5 }],
                            [0, { id: 4 }],
                        ]),
                    )
                        .keyBy("id")
                        .keys()
                        .all(),
                [5, 4],
            ],
            [
                "groupBy",
                () =>
                    new Collection(
                        new Map([
                            [2, { g: 5 }],
                            [0, { g: 4 }],
                        ]),
                    )
                        .groupBy("g")
                        .keys()
                        .all(),
                [5, 4],
            ],
            [
                "countBy",
                () =>
                    new Collection(
                        new Map([
                            [2, 5],
                            [0, 4],
                        ]),
                    )
                        .countBy()
                        .keys()
                        .all(),
                [5, 4],
            ],
            [
                "mapToDictionary",
                () => {
                    const dictionary = new Collection(
                        new Map([
                            [2, 5],
                            [0, 4],
                        ]),
                    ).mapToDictionary((value, key) => ({ [value]: key }));

                    return [dictionary.keys().all(), dictionary.values().all()];
                },
                [
                    [5, 4],
                    [[2], [0]],
                ],
            ],
            [
                "flip",
                () => {
                    const flipped = new Collection(
                        new Map([
                            [2, "x"],
                            [0, "y"],
                            [1, "x"],
                        ]),
                    ).flip();

                    return [flipped.keys().all(), flipped.values().all()];
                },
                [
                    ["x", "y"],
                    [1, 0],
                ],
            ],
        ] as [string, () => unknown, unknown][])(
            "%s reads a Map-built collection in the order it holds its keys",
            (_method, run, expected) => {
                // docs/php-parity/task-32-collection-release-readiness.json,
                // "C32-E-keyed-results-out-of-order-receiver"
                expect(run()).toEqual(expected);
            },
        );

        it("combine pairs a Map-built collection's values in the order it holds them", () => {
            const combined = new Collection(
                new Map([
                    [2, "c"],
                    [0, "a"],
                    [1, "b"],
                ]),
            ).combine(["x", "y", "z"]);

            // docs/php-parity/task-30-map-order.json, "combine-out-of-order"
            expect(combined.all()).toEqual({ c: "x", a: "y", b: "z" });
            expect(combined.keys().all()).toEqual(["c", "a", "b"]);
            expect(combined.values().all()).toEqual(["x", "y", "z"]);
        });

        it("keeps a Map key's type as PHP stores it, as an integer only when canonical", () => {
            const keys = new Collection(
                new Map([
                    ["1.5", "a"],
                    ["Infinity", "b"],
                    ["-1", "c"],
                    ["01", "d"],
                    ["1e3", "e"],
                    ["10", "f"],
                    ["1e+21", "g"],
                ]),
            )
                .keys()
                .all();

            // docs/php-parity/task-23-obj-release-readiness.json, "K1 keys of numeric-looking string keys"
            expect(keys).toEqual([
                "1.5",
                "Infinity",
                -1,
                "01",
                "1e3",
                10,
                "1e+21",
            ]);
        });
    });

    describe("keyed access refuses a key no PHP array can hold", () => {
        class stdClass {}

        const list = () => collect(["a", "b"]);
        const keyed = () => collect({ a: 1, b: 2 });
        /** Each key PHP cannot store, and the type its messages name; a plain object stands in for an array. */
        const illegal: [string, unknown][] = [
            ["array", ["a"]],
            ["array", { a: 1 }],
            ["stdClass", new stdClass()],
            ["Closure", () => 1],
        ];
        const keyExists = new TypeError(
            "array_key_exists(): Argument #1 ($key) must be a valid array offset type",
        );
        /** A key list holding what the signatures refuse, as PHP's array of keys may. */
        const keysOf = (...keys: unknown[]) => keys as PathKey[];

        it("throws from put() and offsetSet() before writing anything", () => {
            for (const [type, key] of illegal) {
                const failure = new TypeError(
                    `Cannot access offset of type ${type} on array`,
                );
                const [listed, keys] = [list(), keyed()];

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-put-illegal-key"
                expect(() => listed.put(key, 9)).toThrow(failure);
                expect(() => keys.put(key, 9)).toThrow(failure);
                expect(() => listed.offsetSet(key as PropertyKey, 9)).toThrow(
                    failure,
                );
                expect(() => keys.offsetSet(key as PropertyKey, 9)).toThrow(
                    failure,
                );
                expect([listed.all(), keys.all()]).toEqual([
                    ["a", "b"],
                    { a: 1, b: 2 },
                ]);
            }
        });

        it("throws array_key_exists()'s TypeError from get() and getOrPut()", () => {
            for (const [, key] of illegal) {
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-get-illegal-key"
                expect(() => list().get(key as PathKey)).toThrow(keyExists);
                expect(() => keyed().get(key as PathKey)).toThrow(keyExists);
                expect(() => list().getOrPut(key as PathKey, 9)).toThrow(
                    keyExists,
                );
                expect(() => keyed().getOrPut(key as PathKey, 9)).toThrow(
                    keyExists,
                );
            }
        });

        it("throws array_key_exists()'s TypeError from has() once it reaches the key, as array_all() does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-has-illegal-key"
            expect(() => list().has(keysOf(["a"]))).toThrow(keyExists);
            expect(() => keyed().has(keysOf(["a"]))).toThrow(keyExists);
            expect(() => list().has(keysOf(0, ["b"]))).toThrow(keyExists);
            expect(() => keyed().has(keysOf("a", ["b"]))).toThrow(keyExists);
            expect(list().has(keysOf("zz", ["b"]))).toBe(false);
            expect(keyed().has(keysOf("zz", ["b"]))).toBe(false);
        });

        it("throws array_key_exists()'s TypeError from hasAny() once it reaches the key, as array_any() does", () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-hasAny-illegal-key"
            expect(() => list().hasAny(keysOf(["a"]))).toThrow(keyExists);
            expect(() => keyed().hasAny(keysOf(["a"]))).toThrow(keyExists);
            expect(list().hasAny(keysOf(0, ["b"]))).toBe(true);
            expect(keyed().hasAny(keysOf("a", ["b"]))).toBe(true);
            expect(() => list().hasAny(keysOf("zz", ["b"]))).toThrow(keyExists);
            expect(() => keyed().hasAny(keysOf("zz", ["b"]))).toThrow(
                keyExists,
            );
            expect(collect([]).hasAny(keysOf(["a"]))).toBe(false);
        });

        it("throws from forget() after unsetting the keys before it, as PHP's loop does", () => {
            for (const [type, key] of illegal) {
                const failure = new TypeError(
                    `Cannot unset offset of type ${type} on array`,
                );

                // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-forget-illegal-key"
                expect(() => list().forget(keysOf(key))).toThrow(failure);
                expect(() => keyed().forget(keysOf(key))).toThrow(failure);
            }

            const [listed, keys] = [list(), keyed()];

            expect(() => listed.forget(keysOf(0, ["b"]))).toThrow(
                new TypeError("Cannot unset offset of type array on array"),
            );
            expect(() => keys.forget(keysOf("a", ["b"]))).toThrow(
                new TypeError("Cannot unset offset of type array on array"),
            );
            // PHP keeps the list's key 1; a list backing reindexes, as a JS array holds no sparse keys.
            expect([listed.all(), keys.all()]).toEqual([["b"], { b: 2 }]);
        });

        it("throws from offsetGet(), offsetExists() and offsetUnset(), each with its own message", () => {
            for (const [type, key] of illegal) {
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-offset-illegal-key"
                for (const collection of [list(), keyed()]) {
                    expect(() =>
                        collection.offsetGet(key as PropertyKey),
                    ).toThrow(
                        new TypeError(
                            `Cannot access offset of type ${type} on array`,
                        ),
                    );
                    expect(() =>
                        collection.offsetExists(key as PropertyKey),
                    ).toThrow(
                        new TypeError(
                            `Cannot access offset of type ${type} in isset or empty`,
                        ),
                    );
                    expect(() =>
                        collection.offsetUnset(key as PropertyKey),
                    ).toThrow(
                        new TypeError(
                            `Cannot unset offset of type ${type} on array`,
                        ),
                    );
                }
            }
        });

        it("throws array_key_exists()'s TypeError from pull()", () => {
            for (const [, key] of illegal) {
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-B-pull-illegal-key"
                expect(() => list().pull(key as PathKey)).toThrow(keyExists);
                expect(() => keyed().pull(key as PathKey)).toThrow(keyExists);
            }
        });
    });

    describe("callbacks and conditions are judged by PHP truthiness", () => {
        /** The items "a" and "b" (or "a" alone), as a list or keyed "x" and "y". */
        const items = (keyed: boolean, one = false) =>
            (keyed
                ? collect(one ? { x: "a" } : { x: "a", y: "b" })
                : collect(one ? ["a"] : ["a", "b"])) as unknown as Collection<
                string,
                PropertyKey
            >;

        /** A result the way the probe's pairs() records it: a list's values, any other keys as [key, value] pairs. */
        const pairs = (result: unknown): unknown => {
            if (!(result instanceof Collection)) {
                return result;
            }

            const keys = result.keys().all() as PropertyKey[];
            const values = (result.values().all() as unknown[]).map(pairs);

            return keys.every((key, index) => key === index)
                ? values
                : keys.map((key, index) => [key, values[index]]);
        };

        /** What `run` answers, or the name of the exception it throws, as the probe records one. */
        const outcome = (run: () => unknown): unknown => {
            try {
                return run();
            } catch (error) {
                return (error as Error).name;
            }
        };

        // PHP casts "0" and [] to false, and every object to true, however empty.
        const answers = ["0", [], new Date(0), new (class {})()];

        /** The same expected answers for the list and the keyed backing. */
        const both = <T>(answer: T) => ({ list: answer, keyed: answer });

        // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-collection-callback-php-truthiness"
        it.each([
            [
                "filter",
                (callback: () => unknown, keyed: boolean) =>
                    pairs(items(keyed).filter(callback)),
                {
                    list: [[], [], ["a", "b"], ["a", "b"]],
                    keyed: [
                        [],
                        [],
                        [
                            ["x", "a"],
                            ["y", "b"],
                        ],
                        [
                            ["x", "a"],
                            ["y", "b"],
                        ],
                    ],
                },
            ],
            [
                "where",
                (callback: () => unknown, keyed: boolean) =>
                    pairs(items(keyed).where(callback)),
                {
                    list: [[], [], ["a", "b"], ["a", "b"]],
                    keyed: [
                        [],
                        [],
                        [
                            ["x", "a"],
                            ["y", "b"],
                        ],
                        [
                            ["x", "a"],
                            ["y", "b"],
                        ],
                    ],
                },
            ],
            [
                "reject",
                (callback: () => unknown, keyed: boolean) =>
                    pairs(items(keyed).reject(callback)),
                {
                    list: [["a", "b"], ["a", "b"], [], []],
                    keyed: [
                        [
                            ["x", "a"],
                            ["y", "b"],
                        ],
                        [
                            ["x", "a"],
                            ["y", "b"],
                        ],
                        [],
                        [],
                    ],
                },
            ],
            [
                "first",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed).first(callback),
                both([null, null, "a", "a"]),
            ],
            [
                "last",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed).last(callback),
                both([null, null, "b", "b"]),
            ],
            [
                "firstWhere",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed).firstWhere(callback),
                both([null, null, "a", "a"]),
            ],
            [
                "firstOrFail",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed).firstOrFail(callback),
                both([
                    "ItemNotFoundException",
                    "ItemNotFoundException",
                    "a",
                    "a",
                ]),
            ],
            [
                "sole",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed, true).sole(callback),
                both([
                    "ItemNotFoundException",
                    "ItemNotFoundException",
                    "a",
                    "a",
                ]),
            ],
            [
                "every",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed).every(callback),
                both([false, false, true, true]),
            ],
            [
                "some",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed).some(callback),
                both([false, false, true, true]),
            ],
            [
                "contains",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed).contains(callback),
                both([false, false, true, true]),
            ],
            [
                "doesntContain",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed).doesntContain(callback),
                both([true, true, false, false]),
            ],
            [
                "containsStrict",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed).containsStrict(callback),
                both([false, false, true, true]),
            ],
            [
                "doesntContainStrict",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed).doesntContainStrict(callback),
                both([true, true, false, false]),
            ],
            [
                "search",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed).search(callback),
                { list: [false, false, 0, 0], keyed: [false, false, "x", "x"] },
            ],
            [
                // The probe's before callback answers for "b" only, so a match has an item before it.
                "before",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed).before((value) =>
                        value === "b" ? callback() : false,
                    ),
                both([null, null, "a", "a"]),
            ],
            [
                "after",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed).after(callback),
                both([null, null, "b", "b"]),
            ],
            [
                "hasSole",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed, true).hasSole(callback),
                both([false, false, true, true]),
            ],
            [
                "containsOneItem",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed, true).containsOneItem(callback),
                both([false, false, true, true]),
            ],
            [
                "hasMany",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed).hasMany(callback),
                both([false, false, true, true]),
            ],
            [
                "containsManyItems",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed).containsManyItems(callback),
                both([false, false, true, true]),
            ],
            [
                "partition",
                (callback: () => unknown, keyed: boolean) =>
                    pairs(items(keyed).partition(callback)),
                {
                    list: [
                        [[], ["a", "b"]],
                        [[], ["a", "b"]],
                        [["a", "b"], []],
                        [["a", "b"], []],
                    ],
                    keyed: [
                        [
                            [],
                            [
                                ["x", "a"],
                                ["y", "b"],
                            ],
                        ],
                        [
                            [],
                            [
                                ["x", "a"],
                                ["y", "b"],
                            ],
                        ],
                        [
                            [
                                ["x", "a"],
                                ["y", "b"],
                            ],
                            [],
                        ],
                        [
                            [
                                ["x", "a"],
                                ["y", "b"],
                            ],
                            [],
                        ],
                    ],
                },
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-skip-take-callback-php-truthiness"
                "skipUntil",
                (callback: () => unknown, keyed: boolean) =>
                    pairs(items(keyed).skipUntil(callback)),
                {
                    list: [[], [], ["a", "b"], ["a", "b"]],
                    keyed: [
                        [],
                        [],
                        [
                            ["x", "a"],
                            ["y", "b"],
                        ],
                        [
                            ["x", "a"],
                            ["y", "b"],
                        ],
                    ],
                },
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-skip-take-callback-php-truthiness"
                "skipWhile",
                (callback: () => unknown, keyed: boolean) =>
                    pairs(items(keyed).skipWhile(callback)),
                {
                    list: [["a", "b"], ["a", "b"], [], []],
                    keyed: [
                        [
                            ["x", "a"],
                            ["y", "b"],
                        ],
                        [
                            ["x", "a"],
                            ["y", "b"],
                        ],
                        [],
                        [],
                    ],
                },
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-skip-take-callback-php-truthiness"
                "takeUntil",
                (callback: () => unknown, keyed: boolean) =>
                    pairs(items(keyed).takeUntil(callback)),
                {
                    list: [["a", "b"], ["a", "b"], [], []],
                    keyed: [
                        [
                            ["x", "a"],
                            ["y", "b"],
                        ],
                        [
                            ["x", "a"],
                            ["y", "b"],
                        ],
                        [],
                        [],
                    ],
                },
            ],
            [
                // docs/php-parity/task-32-collection-release-readiness.json, "C32-D-skip-take-callback-php-truthiness"
                "takeWhile",
                (callback: () => unknown, keyed: boolean) =>
                    pairs(items(keyed).takeWhile(callback)),
                {
                    list: [[], [], ["a", "b"], ["a", "b"]],
                    keyed: [
                        [],
                        [],
                        [
                            ["x", "a"],
                            ["y", "b"],
                        ],
                        [
                            ["x", "a"],
                            ["y", "b"],
                        ],
                    ],
                },
            ],
            [
                // The probe records each chunk's values.
                "chunkWhile",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed)
                        .chunkWhile(callback)
                        .map((chunk) => chunk.values().all())
                        .all(),
                both([
                    [["a"], ["b"]],
                    [["a"], ["b"]],
                    [["a", "b"]],
                    [["a", "b"]],
                ]),
            ],
            [
                "percentage",
                (callback: () => unknown, keyed: boolean) =>
                    items(keyed).percentage(callback),
                both([0, 0, 100, 100]),
            ],
        ] as [
            string,
            (callback: () => unknown, keyed: boolean) => unknown,
            { list: unknown[]; keyed: unknown[] },
        ][])(
            "%s judges its callback's result by PHP truthiness on either backing",
            (_name, run, expected) => {
                expect(
                    answers.map((answer) =>
                        outcome(() => run(() => answer, false)),
                    ),
                ).toEqual(expected.list);
                expect(
                    answers.map((answer) =>
                        outcome(() => run(() => answer, true)),
                    ),
                ).toEqual(expected.keyed);
            },
        );

        // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-collection-callback-php-truthiness",
        // which records whether the callback ran
        it.each([
            [
                "when",
                (condition: unknown, keyed: boolean) => {
                    let called = false;

                    items(keyed).when(condition, () => {
                        called = true;
                    });

                    return called;
                },
                both([false, false, true, true]),
            ],
            [
                "unless",
                (condition: unknown, keyed: boolean) => {
                    let called = false;

                    items(keyed).unless(condition, () => {
                        called = true;
                    });

                    return called;
                },
                both([true, true, false, false]),
            ],
        ] as [
            string,
            (condition: unknown, keyed: boolean) => unknown,
            { list: unknown[]; keyed: unknown[] },
        ][])(
            "%s judges its condition by PHP truthiness on either backing",
            (_name, run, expected) => {
                expect(answers.map((answer) => run(answer, false))).toEqual(
                    expected.list,
                );
                expect(answers.map((answer) => run(answer, true))).toEqual(
                    expected.keyed,
                );
            },
        );

        it("first and last judge their callback's result by PHP truthiness on a Map-built backing", () => {
            const ordered = () =>
                collect(
                    new Map([
                        [2, "a"],
                        [0, "b"],
                    ]),
                );

            // docs/php-parity/task-32-collection-release-readiness.json,
            // "C32-C-ordered-first-last-callback-php-truthiness"
            expect({
                first: answers.map((answer) => ordered().first(() => answer)),
                last: answers.map((answer) => ordered().last(() => answer)),
            }).toEqual({
                first: [null, null, "a", "a"],
                last: [null, null, "b", "b"],
            });
        });

        it('finds no match for a callback answering "0" or []', () => {
            // docs/php-parity/task-32-collection-release-readiness.json, "C32-C-callback-php-truthiness"
            expect({
                contains: collect([1]).contains(() => "0"),
                first: collect([1, 2]).first(() => "0"),
                "first-array": collect([1, 2]).first(() => []),
                search: collect([1, 2]).search(() => "0"),
                every: collect([1, 2]).every(() => "0"),
                hasSole: collect([1]).hasSole(() => "0"),
                hasMany: collect([1, 2]).hasMany(() => []),
            }).toEqual({
                contains: false,
                first: null,
                "first-array": null,
                search: false,
                every: false,
                hasSole: false,
                hasMany: false,
            });
        });
    });
});

// Only JSON.parse produces a real own enumerable "__proto__" key; a literal
// `{ __proto__: ... }` sets the prototype at construction time instead.
const HOSTILE = () =>
    JSON.parse('{"a":1,"__proto__":{"polluted":true},"c":3}') as Record<
        string,
        unknown
    >;

describe("computed-key writes treat __proto__ as data, not a prototype", () => {
    afterEach(() => {
        // Every case below writes into a *fresh* result object; none of them
        // should ever be able to touch the shared Object.prototype itself.
        expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
    });

    describe.each([
        [
            "keyBy",
            () => new Collection([{ k: "__proto__", v: 1 }]).keyBy("k").all(),
        ],
        [
            "groupBy",
            () => new Collection([{ k: "__proto__" }]).groupBy("k").all(),
        ],
        [
            // preserveKeys puts the hostile key on the INNER group, so the inner
            // object is the one the shared assertions have to see.
            "groupBy (preserveKeys)",
            () =>
                new Collection(JSON.parse('{"__proto__":{"k":"z"}}'))
                    .groupBy("k", true)
                    .get("z")
                    .all(),
        ],
        [
            "groupBy (nested)",
            () =>
                new Collection([{ k: "__proto__", j: "x" }])
                    .groupBy(["k", "j"])
                    .all(),
        ],
        ["countBy", () => new Collection(["__proto__"]).countBy().all()],
        [
            "mapToDictionary",
            () =>
                new Collection([{ n: "__proto__", i: 1 }])
                    .mapToDictionary((item) => ({ [item.n]: item.i }))
                    .all(),
        ],
        [
            "mapWithKeys",
            () =>
                new Collection([1])
                    .mapWithKeys(() =>
                        JSON.parse('{"__proto__":{"polluted":true}}'),
                    )
                    .all(),
        ],
        ["sortKeys", () => new Collection(HOSTILE()).sortKeys().all()],
        [
            "sortKeysUsing",
            () =>
                new Collection(HOSTILE())
                    .sortKeysUsing((a, b) => String(a).localeCompare(String(b)))
                    .all(),
        ],
        ["unshift", () => new Collection(HOSTILE()).unshift(9).all()],
        [
            "mergeRecursive",
            () => new Collection({ z: 1 }).mergeRecursive(HOSTILE()).all(),
        ],
        [
            "mergeRecursive (nested)",
            () =>
                (
                    new Collection({ z: { q: 1 } })
                        .mergeRecursive(
                            JSON.parse('{"z":{"__proto__":{"polluted":true}}}'),
                        )
                        .all() as Record<string, unknown>
                )["z"],
        ],
        ["diffAssoc", () => new Collection(HOSTILE()).diffAssoc({}).all()],
        ["diffKeys", () => new Collection(HOSTILE()).diffKeys({}).all()],
        [
            "diffUsing",
            () => new Collection(HOSTILE()).diffUsing({}, () => false).all(),
        ],
        [
            "duplicates",
            () =>
                new Collection(JSON.parse('{"a":1,"__proto__":1,"c":3}'))
                    .duplicates()
                    .all(),
        ],
        [
            "adoptRawItems (Map key)",
            () =>
                new Collection(
                    new Map<string, unknown>([
                        ["a", 1],
                        ["__proto__", { polluted: true }],
                        ["c", 3],
                    ]),
                ).all(),
        ],
        [
            "offsetSet",
            () => {
                const collection = new Collection<unknown, string>({ a: 1 });
                collection.offsetSet("__proto__", 2);

                return collection.all();
            },
        ],
        [
            "pull (recursive conversion)",
            () => {
                const collection = new Collection(HOSTILE());
                collection.pull("nope");

                return collection.all();
            },
        ],
    ] as [string, () => unknown][])("%s", (_name, run) => {
        it("treats __proto__ as data, not as a prototype", () => {
            // PHP has no inherited __proto__ setter, so every row keeps it as an
            // ordinary key. PHP-verified in docs/php-parity/task-16-final-review.json
            // ('"__proto__" is an ordinary array key in every keyed Collection result').
            const result = run();

            expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
            expect(Object.hasOwn(result as object, "__proto__")).toBe(true);
            expect((result as { polluted?: boolean }).polluted).toBeUndefined();
        });
    });

    // Unlike every row above, the hostile input here is the KEY ARGUMENT, not the data, so it
    // reaches the keyed write that `put`/`offsetSet`/`getOrPut` share on a list backing.
    describe.each([
        [
            "put",
            (collection: Collection<unknown, PropertyKey>) => {
                collection.put("__proto__", { polluted: true });
            },
        ],
        [
            "offsetSet",
            (collection: Collection<unknown, PropertyKey>) => {
                collection.offsetSet("__proto__", { polluted: true });
            },
        ],
        [
            "getOrPut",
            (collection: Collection<unknown, PropertyKey>) => {
                collection.getOrPut("__proto__", { polluted: true });
            },
        ],
    ])("%s on an array-backed collection", (_name, write) => {
        it("keeps a __proto__ key argument as data, not as a prototype", () => {
            // PHP-verified in docs/php-parity/task-16-final-review.json
            // ('"__proto__" is an ordinary key on an array-backed collection too'):
            // collect([1,2])->put("__proto__", …) keeps the key and still maps.
            const collection = new Collection<unknown, PropertyKey>([1, 2]);
            write(collection);

            const items = collection.all();

            expect(Object.getPrototypeOf(items)).toBe(Object.prototype);
            expect(Object.hasOwn(items as object, "__proto__")).toBe(true);
            expect(collection.map((value) => value).all()).toEqual({
                0: 1,
                1: 2,
                ["__proto__"]: { polluted: true },
            });
            expect(collection.keys().all()).toEqual([0, 1, "__proto__"]);
            expect(collection.values().all()).toEqual([
                1,
                2,
                { polluted: true },
            ]);
        });
    });

    it("still appends through put at a numeric key", () => {
        // PHP-verified in the same row (list_put_index): collect([1,2])->put(2,3)
        // is [1,2,3]. defineKey must not change the ordinary index write.
        const collection = new Collection<number, number>([1, 2]);
        collection.put(2, 3);

        expect(collection.all()).toEqual([1, 2, 3]);
    });
});

// A collection built straight from a prototype object would otherwise let put,
// push and add write onto a global every value in the process inherits from.
describe("prototype objects as write targets", () => {
    const prototypes: [string, object][] = [
        ["Object.prototype", Object.prototype],
        ["Array.prototype", Array.prototype],
        ["Function.prototype", Function.prototype],
    ];

    afterEach(() => {
        for (const [, prototype] of prototypes) {
            const record = prototype as Record<string, unknown>;
            delete record["PWNED"];
            delete record["0"];
        }
        Array.prototype.length = 0;
    });

    it.each(prototypes)(
        "put, push and add never write into %s",
        (_label, prototype) => {
            new Collection(prototype as Record<string, unknown>).put(
                "PWNED",
                1,
            );
            new Collection(prototype as Record<string, unknown>).push(1);
            new Collection(prototype as Record<string, unknown>).add(1);

            for (const [, other] of prototypes) {
                expect(Object.getOwnPropertyNames(other)).not.toContain(
                    "PWNED",
                );
                expect(Object.getOwnPropertyNames(other)).not.toContain("0");
            }
            expect(Array.prototype.length).toBe(0);
            expect(({} as { PWNED?: unknown }).PWNED).toBeUndefined();
        },
    );
});
