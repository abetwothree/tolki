import { collect, Collection } from "@tolki/collection";
import { Stringable } from "@tolki/str";
import { assertType, describe, expect, it } from "vitest";

import {
    TestArrayableObject,
    TestCollectionMapIntoObject,
    TestJsonableObject,
    TestJsonSerializeObject,
    TestJsonSerializeToStringObject,
    TestJsonSerializeWithScalarValueObject,
    TestTraversableAndJsonSerializableObject,
} from "./test-classes";

// Case-insensitive string comparison (like PHP's strcasecmp)
// Returns true if items are equal (should be excluded from diff)
const strcasecmp = (a: unknown, b: unknown): boolean => {
    if (typeof a === "string" && typeof b === "string") {
        return a.toLowerCase() === b.toLowerCase();
    }
    return a === b;
};

const strcasecmpKeys = (a: unknown, b: unknown) =>
    String(a).toLowerCase() === String(b).toLowerCase();

const strnatcasecmp = (a: unknown, b: unknown): number => {
    if (typeof a === "string" && typeof b === "string") {
        return a.localeCompare(b, undefined, { sensitivity: "base" });
    }

    return 0;
};

const strrev = (s: string): string => {
    return s.split("").reverse().join("");
};

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

        it("null and undefined", () => {
            const collection = collect(null);
            assertType<Collection<[], number>>(collection);

            const collection2 = new Collection(null);
            // @ts-expect-error - constructor with null gives Collection<unknown, PropertyKey> not Collection<[], number>
            assertType<Collection<[], number>>(collection2);

            const fromCollection = collect(collection);
            assertType<Collection<[], number>>(fromCollection);
        });

        it("map", () => {
            const data = collect(
                new Map([
                    [3, { id: 1, name: "A" }],
                    [5, { id: 3, name: "B" }],
                    [4, { id: 2, name: "C" }],
                ]),
            );

            assertType<Collection<{ id: number; name: string }, number>>(data);
        });
    });

    describe("constructor", () => {
        it("creates empty collection with no arguments", () => {
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
            const collection = collect({ a: 1, b: 2 });
            expect(collection.all()).toEqual({ a: 1, b: 2 });
        });

        it("creates collection from null or undefined values", () => {
            const collectionFromNull = collect(null);
            expect(collectionFromNull.all()).toEqual([]);

            const collectionFromUndefined = collect(undefined);
            expect(collectionFromUndefined.all()).toEqual([]);
        });

        it("creates a collection from another collection", () => {
            const original = collect([1, 2, 3]);
            const collection = collect(original);
            expect(collection.all()).toEqual([1, 2, 3]);
        });

        it("creates a collection from an object with a toArray method", () => {
            const arrayable = {
                toArray: () => [4, 5, 6],
            };
            const collection = collect(arrayable);
            expect(collection.all()).toEqual([4, 5, 6]);
        });

        it("creates a collection from a primitive value (string, number, boolean)", () => {
            const stringCollection = collect("hello");
            expect(stringCollection.all()).toEqual(["hello"]);

            const numberCollection = collect(42);
            expect(numberCollection.all()).toEqual([42]);

            const booleanCollection = collect(true);
            expect(booleanCollection.all()).toEqual([true]);
        });

        it("creates a collection from a Map", () => {
            const data = collect(
                new Map([
                    [3, { id: 1, name: "A" }],
                    [5, { id: 3, name: "B" }],
                    [4, { id: 2, name: "C" }],
                ]),
            );
            expect(data.all()).toEqual({
                3: { id: 1, name: "A" },
                5: { id: 3, name: "B" },
                4: { id: 2, name: "C" },
            });
        });

        it("constructor preserves itemsWithOrder when created from another Collection", () => {
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
    });

    describe("Symbol.iterator", () => {
        it("makes the collection iterable with for...of", () => {
            const collection = collect([10, 20, 30]);
            const result: number[] = [];
            for (const item of collection) {
                result.push(item);
            }
            expect(result).toEqual([10, 20, 30]);
        });

        it("makes the collection iterable with for...of for object items", () => {
            const collection = collect({ a: 1, b: 2, c: 3 });
            const result: number[] = [];
            for (const item of collection) {
                result.push(item);
            }
            expect(result).toEqual([1, 2, 3]);
        });
    });

    describe("test helper classes", () => {
        it("TestArrayableObject implements toArray", () => {
            const obj = new TestArrayableObject();
            expect(obj.toArray()).toEqual([{ foo: "bar" }]);
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
        it("creates collection with range", () => {
            const collection = Collection.range(1, 5);
            expect(collection.all()).toEqual([1, 2, 3, 4, 5]);
        });

        it("creates collection with step", () => {
            const collection = Collection.range(1, 10, 2);
            expect(collection.all()).toEqual([1, 3, 5, 7, 9]);
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
            // After sorting by JSON string representation, the order is:
            // {"age":20,"value":1}, {"age":25,"value":2}, {"age":30,"value":3}
            // So the median (middle item) is {"age":25,"value":2}
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
        it("test when count is not % === 2", () => {
            const collection = collect([1, 2, 3, 4, 5, 6]);
            expect(collection.median()).toBe(3.5);
        });
        it("Laravel tests", () => {
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
    });

    describe("collapse", () => {
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
    });

    describe("collapseWithKeys", () => {
        it("Laravel Tests", () => {
            const data = collect([{ 1: "a" }, { 3: "c" }, { 2: "b" }, "drop"]);
            expect(data.collapseWithKeys().all()).toEqual({
                1: "a",
                3: "c",
                2: "b",
            });

            const data2 = collect(["a", "b", "c"]);
            expect(data2.collapseWithKeys().all()).toEqual([]);

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
    });

    describe("contains", () => {
        it("Laravel Tests", () => {
            const c = new Collection([1, 3, 5]);

            expect(c.contains(1)).toBe(true);
            expect(c.contains("1")).toBe(true);
            expect(c.contains(2)).toBe(false);
            expect(c.contains("2")).toBe(false);

            const d = collect([1]);
            expect(d.contains(1)).toBe(true);
            expect(d.contains("1")).toBe(true);

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
    });

    describe("containsStrict", () => {
        it("Laravel Tests", () => {
            const c = new Collection([1, 3, 5, "02"]);
            expect(c.containsStrict(1)).toBe(true);
            expect(c.containsStrict("1")).toBe(false);
            expect(c.containsStrict(2)).toBe(false);
            expect(c.containsStrict("2")).toBe(false);
            expect(c.containsStrict("02")).toBe(true);
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

        it("uses strict comparison in object", () => {
            const collection = new Collection({
                a: 1,
                b: 2,
                c: 3,
            });
            expect(collection.containsStrict(2)).toBe(true);
            expect(collection.containsStrict("2")).toBe(false);
        });
    });

    describe("doesntContain", () => {
        it("Laravel Tests", () => {
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
    });

    describe("doesntContainStrict", () => {
        it("Laravel Tests", () => {
            const c = collect([1, 3, 5, "02"]);
            expect(c.doesntContainStrict(1)).toBe(false);
            expect(c.doesntContainStrict("1")).toBe(true);
            expect(c.doesntContainStrict(2)).toBe(true);
            expect(c.doesntContainStrict("2")).toBe(true);
            expect(c.doesntContainStrict("02")).toBe(false);
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
    });

    describe("crossJoin", () => {
        it("Laravel Tests", () => {
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
    });

    describe("diff", () => {
        it("Laravel Tests", () => {
            const c = collect({ id: 1, first_word: "Hello" });
            expect(
                c
                    .diff(collect({ first_word: "Hello", last_word: "World" }))
                    .all(),
            ).toEqual({ id: 1 });

            const d = collect(["en_GB", "fr", "HR"]);
            expect(
                d
                    .diff(collect(["en_gb", "hr"]))
                    .values()
                    .toArray(),
            ).toEqual(["en_GB", "fr", "HR"]);

            const e = collect({ id: 1, first_word: "Hello" });
            expect(e.diff(null).all()).toEqual({ id: 1, first_word: "Hello" });
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
    });

    describe("diffUsing", () => {
        it("Laravel Tests", () => {
            const d = collect(["en_GB", "fr", "HR"]);

            // Test case-insensitive diff: 'en_GB' matches 'en_gb', 'HR' matches 'hr', only 'fr' remains
            expect(
                d
                    .diffUsing(collect(["en_gb", "hr"]), strcasecmp)
                    .values()
                    .toArray(),
            ).toEqual(["fr"]);

            // Test diff against empty collection: all items should remain
            expect(d.diffUsing(null, strcasecmp).values().toArray()).toEqual([
                "en_GB",
                "fr",
                "HR",
            ]);
        });
    });

    describe("diffAssoc", () => {
        it("Laravel Tests", () => {
            const c1 = collect({
                id: 1,
                first_word: "Hello",
                not_affected: "value",
            });
            const c2 = { id: 123, foo_bar: "Hello", not_affected: "value" };

            // diffAssoc compares BOTH keys AND values
            // 'id' has same key but different value (1 vs 123) → included
            // 'first_word' has different key from 'foo_bar' → included
            // 'not_affected' has same key AND same value → excluded
            expect(c1.diffAssoc(c2).all()).toEqual({
                id: 1,
                first_word: "Hello",
            });

            // Test case-sensitive key comparison
            const c3 = collect({ a: "green", b: "brown", c: "blue", 0: "red" });
            const c4 = collect({ A: "green", 0: "yellow", 1: "red" });

            // diffAssoc is case-sensitive for keys:
            // 'a' !== 'A', so 'a: green' is included
            // 'b' doesn't exist in c4, so 'b: brown' is included
            // 'c' doesn't exist in c4, so 'c: blue' is included
            // index 0 has different value ('red' vs 'yellow'), so '0: red' is included
            expect(c3.diffAssoc(c4).all()).toEqual({
                a: "green",
                b: "brown",
                c: "blue",
                0: "red",
            });

            // diffAssocUsing uses callback for KEY comparison (case-insensitive), values compared strictly
            // Expected: { b: "brown", c: "blue", 0: "red" }
            // 'a' matches 'A' case-insensitively with same value → excluded
            // 'b' has no case-insensitive match → included
            // 'c' has no case-insensitive match → included
            // index 0 exists in both BUT different value ('red' vs 'yellow') → included
            expect(c3.diffAssocUsing(c4, strcasecmpKeys).all()).toEqual({
                b: "brown",
                c: "blue",
                0: "red",
            });
        });
    });

    describe("diffKeys", () => {
        it("Laravel Tests", () => {
            const c1 = collect({ id: 1, first_word: "Hello" });
            const c2 = collect({ id: 123, foo_bar: "Hello" });
            expect(c1.diffKeys(c2).all()).toEqual({ first_word: "Hello" });

            const d1 = collect({ id: 1, first_word: "Hello" });
            const d2 = collect({ ID: 123, foo_bar: "Hello" });
            expect(d1.diffKeys(d2).all()).toEqual({
                id: 1,
                first_word: "Hello",
            });
        });

        it("signature examples", () => {
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
    });

    describe("diffKeysUsing", () => {
        it("Laravel Tests", () => {
            const c1 = collect({ id: 1, first_word: "Hello" });
            const c2 = { ID: 123, foo_bar: "Hello" } as Record<string, unknown>;

            expect(c1.diffKeysUsing(c2, strcasecmpKeys).all()).toEqual({
                first_word: "Hello",
            });
        });
    });

    describe("duplicates", () => {
        describe("Laravel Tests", () => {
            it("test duplicates", () => {
                // Keys are preserved! Returns duplicate items with their original indices
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
                // When using a key, Laravel returns the VALUES (not the full objects) at duplicate indices
                // Laravel: [2 => 'laravel']
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
                // When using a callback, Laravel returns the CALLBACK RESULT (not the full objects) at duplicate indices
                // Laravel: [2 => 'laravel']
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
    });

    describe("duplicatesStrict", () => {
        it("Laravel Tests", () => {
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
    });

    describe("except", () => {
        it("Laravel Tests", () => {
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

            const data2 = collect({ first: "Taylor", last: "Otwell" });
            expect(data2.except(data2).all()).toEqual({
                first: "Taylor",
                last: "Otwell",
            });
        });
    });

    describe("filter", () => {
        it("Laravel Tests", () => {
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
    });

    describe("first", () => {
        describe("Laravel Tests", () => {
            it("test first returns first item in collection", () => {
                const c = collect(["foo", "bar"]);
                expect(c.first()).toBe("foo");
            });

            it("test first with callback", () => {
                const c = collect(["foo", "bar", "baz"]);
                expect(
                    c.first((value) => {
                        return value === "bar";
                    }),
                ).toBe("bar");
            });

            it("test first with callback and default", () => {
                const c = collect(["foo", "bar"]);
                expect(
                    c.first((value) => {
                        return value === "baz";
                    }, "default"),
                ).toBe("default");
            });

            it("test first with default and without callback", () => {
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
            const collection = collect<number>({ a: 1, b: 2, c: 3, d: 4 });
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
            const collection = collect<number>({ a: 1, b: 2, c: 3 });
            expect(collection.first((value) => value > 5, "default")).toBe(
                "default",
            );
        });
    });

    describe("flatten", () => {
        describe("Laravel Tests", () => {
            it("test flatten", () => {
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

            it("test flatten ignores keys", () => {
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
    });

    describe("flip", () => {
        it("Laravel Test", () => {
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
        });
    });

    describe("forget", () => {
        describe("Laravel Tests", () => {
            it("test forget single key", () => {
                const c = collect(["bar", "qux"]).forget(0).all();
                expect(c).toEqual(["qux"]);

                const d = collect({ foo: "bar", baz: "qux" })
                    .forget("foo")
                    .all();
                expect(d).toEqual({ baz: "qux" });
            });

            it("test forget array of keys", () => {
                const d = collect(["foo", "bar", "baz"]).forget([0, 2]).all();
                expect(d).toEqual(["bar"]);

                const c = collect({ name: "taylor", foo: "bar", baz: "qux" })
                    .forget(["foo", "baz"])
                    .all();
                expect(c).toEqual({ name: "taylor" });
            });

            it("test forget collection of keys", () => {
                const c = collect(["foo", "bar", "baz"]);
                const res = c.forget(collect([0, 2])).all();
                expect(res).toEqual(["bar"]);

                const d = collect({ name: "taylor", foo: "bar", baz: "qux" });
                const res2 = d.forget(collect(["foo", "baz"])).all();
                expect(res2).toEqual({ name: "taylor" });
            });
        });
    });

    describe("set", () => {
        it("sets value by key in object", () => {
            const collection = collect({ a: 1, b: 2 });
            collection.set("c", 3);
            expect(collection.all()).toEqual({ a: 1, b: 2, c: 3 });
        });

        it("sets value by index in array", () => {
            const collection = collect([1, 2, 3]);
            collection.set(1, 4);
            expect(collection.all()).toEqual([1, 4, 3]);
        });

        it("sets nested object path using dot notation", () => {
            const collection = collect({});
            collection.set("user.profile.name", "Taylor");
            expect(collection.all()).toEqual({
                user: { profile: { name: "Taylor" } },
            });
        });

        // Note: nested array index via dot paths is not supported by dataSet in this implementation.

        it("returns the collection instance for chaining", () => {
            const collection = collect({});
            const returned = collection.set("a", 1).set("b.c", 2);
            expect(returned).toBe(collection);
            expect(collection.all()).toEqual({ a: 1, b: { c: 2 } });
        });
    });

    describe("get", () => {
        it("gets value by key in object", () => {
            const collection = collect({ a: 1, b: 2, c: 3 });
            expect(collection.get("b")).toBe(2);
        });

        it("gets value by key in array", () => {
            const collection = collect([1, 2, 3]);
            expect(collection.get(1)).toBe(2);
        });

        it("returns default for missing object key", () => {
            const collection = collect({ a: 1, b: 2, c: 3 });
            expect(collection.get("d", "default")).toBe("default");
        });

        it("returns default for missing array index", () => {
            const collection = collect([1, 2, 3]);
            expect(collection.get(5, "default")).toBe("default");
        });
    });

    describe("getOrPut", () => {
        describe("Laravel tests", () => {
            it("test get or put", () => {
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
    });

    describe("groupBy", () => {
        describe("Laravel Tests", () => {
            it("test group by attribute", () => {
                const data = collect([
                    { rating: 1, url: "1" },
                    { rating: 1, url: "1" },
                    { rating: 2, url: "2" },
                ]);

                const resultByRating = data.groupBy("rating");
                expect(resultByRating.all()).toEqual({
                    1: [
                        { rating: 1, url: "1" },
                        { rating: 1, url: "1" },
                    ],
                    2: [{ rating: 2, url: "2" }],
                });

                const resultByUrl = data.groupBy("url");
                expect(resultByUrl.all()).toEqual({
                    1: [
                        { rating: 1, url: "1" },
                        { rating: 1, url: "1" },
                    ],
                    2: [{ rating: 2, url: "2" }],
                });
            });

            it("test group by attribute with stringable key", () => {
                const payload = [
                    { name: new Stringable("Laravel"), url: "1" },
                    { name: new Stringable("Laravel"), url: "1" },
                    {
                        name: {
                            toString(): string {
                                return "Framework";
                            },
                        },
                        url: "2",
                    },
                ];
                const data = collect(payload);

                const resultByName = data.groupBy("name");
                expect(resultByName.all()).toEqual({
                    Laravel: [payload[0], payload[1]],
                    Framework: [payload[2]],
                });

                const resultByUrl = data.groupBy("url");
                expect(resultByUrl.all()).toEqual({
                    1: [payload[0], payload[1]],
                    2: [payload[2]],
                });
            });

            it("test group by callable", () => {
                const data = collect([
                    { rating: 1, url: "1" },
                    { rating: 1, url: "1" },
                    { rating: 2, url: "2" },
                ]);

                const resultByRating = data.groupBy((item) => item.rating);
                expect(resultByRating.all()).toEqual({
                    1: [
                        { rating: 1, url: "1" },
                        { rating: 1, url: "1" },
                    ],
                    2: [{ rating: 2, url: "2" }],
                });

                const resultByUrl = data.groupBy((item) => item.url);
                expect(resultByUrl.all()).toEqual({
                    1: [
                        { rating: 1, url: "1" },
                        { rating: 1, url: "1" },
                    ],
                    2: [{ rating: 2, url: "2" }],
                });
            });

            it("test group by attribute preserving keys", () => {
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

                expect(result.all()).toEqual(expected_result);
            });

            it("test group by closure where items have single group", () => {
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

                expect(result.all()).toEqual(expected_result);
            });

            it("test group by closure where items have single group preserving keys", () => {
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

                expect(result.all()).toEqual(expected_result);
            });

            it("test group by closure where items have multiple groups", () => {
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

                expect(result.all()).toEqual(expected_result);
            });

            it("test group by closure where items have multiple groups preserving keys", () => {
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

                expect(result.all()).toEqual(expected_result);
            });

            it("test group by multi-level and closure preserving keys", () => {
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

                expect(result.all()).toEqual(expected_result);
            });
        });

        it("throw error when no groupBy is undefined", () => {
            const collection = collect([1, 2, 3]);
            expect(() => {
                // @ts-expect-error testing invalid input
                collection.groupBy([undefined]);
            }).toThrowError();
        });

        it("group key is boolean", () => {
            const collection = collect([{ active: true }, { active: false }]);
            const grouped = collection.groupBy("active");
            expect(grouped.all()).toEqual({
                1: [{ active: true }],
                0: [{ active: false }],
            });
        });

        it("group key is null", () => {
            const collection = collect([{ value: null }, { value: 1 }]);
            const grouped = collection.groupBy("value");
            expect(grouped.all()).toEqual({
                1: [{ value: 1 }],
            });
        });

        it("group key is undefined", () => {
            const collection = collect([{ value: undefined }, { value: 1 }]);
            const grouped = collection.groupBy("value");
            expect(grouped.all()).toEqual({
                1: [{ value: 1 }],
            });
        });

        it("group key is array", () => {
            const collection = collect([
                { tags: ["tag1", "tag2"] },
                { tags: ["tag2", "tag3"] },
            ]);
            const grouped = collection.groupBy("tags");
            expect(grouped.all()).toEqual({
                tag1: [{ tags: ["tag1", "tag2"] }],
                tag2: [{ tags: ["tag1", "tag2"] }, { tags: ["tag2", "tag3"] }],
                tag3: [{ tags: ["tag2", "tag3"] }],
            });
        });
    });

    describe("keyBy", () => {
        describe("Laravel Tests", () => {
            it("test key by attribute", () => {
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
        });

        it("resolved key is object", () => {
            const collection = collect([
                { id: { name: "John" } },
                { id: { name: "Jane" } },
            ]);
            const keyed = collection.keyBy((item) => item.id);
            expect(keyed.all()).toEqual({
                '{"name":"John"}': { id: { name: "John" } },
                '{"name":"Jane"}': { id: { name: "Jane" } },
            });
        });

        it("resolved key is array", () => {
            const collection = collect([{ id: [1, 2] }, { id: [3, 4] }]);
            const keyed = collection.keyBy((item) => item.id);
            expect(keyed.all()).toEqual({
                "1.2": { id: [1, 2] },
                "3.4": { id: [3, 4] },
            });
        });
    });

    describe("has", () => {
        it("Laravel Tests", () => {
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
    });

    describe("hasAny", () => {
        it("Laravel Tests", () => {
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
    });

    describe("implode", () => {
        describe("Laravel Tests", () => {
            it("test implode", () => {
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
        });
    });

    describe("intersect", () => {
        describe("Laravel Tests", () => {
            it("test intersect null", () => {
                const c = collect({ id: 1, first_word: "Hello" });
                expect(c.intersect(null).all()).toEqual({});

                const c2 = collect([1, "Hello"]);
                expect(c2.intersect(null).all()).toEqual([]);
            });

            it("test intersect collection", () => {
                const c = collect({ id: 1, first_word: "Hello" });
                expect(
                    c
                        .intersect(
                            collect({
                                first_word: "Hello",
                                last_word: "World",
                            }),
                        )
                        .all(),
                ).toEqual({
                    first_word: "Hello",
                });
            });
        });
    });

    describe("intersectUsing", () => {
        describe("Laravel Tests", () => {
            it("test intersect using with null", () => {
                const c = collect(["green", "brown", "blue"]);
                expect(c.intersectUsing(null, strcasecmp).all()).toEqual([]);

                const d = collect({ id: 1, first_word: "Hello" });
                expect(d.intersectUsing(null, strcasecmp).all()).toEqual({});
            });

            it("test intersect using collection", () => {
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
    });

    describe("intersectAssoc", () => {
        describe("Laravel Tests", () => {
            it("test intersect assoc with null", () => {
                const array1 = collect({
                    a: "green",
                    b: "brown",
                    c: "blue",
                    0: "red",
                });

                expect(array1.intersectAssoc(null).all()).toEqual({});
            });

            it("test intersect assoc collection", () => {
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
    });

    describe("intersectAssocUsing", () => {
        describe("Laravel Tests", () => {
            it("test intersect assoc using with null", () => {
                const array1 = collect({
                    a: "green",
                    b: "brown",
                    c: "blue",
                    0: "red",
                });

                expect(
                    array1.intersectAssocUsing(null, strcasecmpKeys).all(),
                ).toEqual({});
            });

            it("test intersect assoc using collection", () => {
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
                    array1.intersectAssocUsing(array2, strcasecmpKeys).all(),
                ).toEqual({ b: "brown" });
            });
        });

        describe("test intersect assoc using with arrays", () => {
            it("test intersect assoc using with arrays with null", () => {
                const array1 = collect(["green", "brown", "blue", "red"]);

                expect(
                    array1.intersectAssocUsing(null, strcasecmpKeys).all(),
                ).toEqual([]);
            });

            it("test intersect assoc using with arrays collection", () => {
                const array1 = collect(["green", "brown", "blue", "red"]);
                const array2 = collect(["GREEN", "brown", "yellow", "red"]);

                expect(
                    array1.intersectAssocUsing(array2, strcasecmpKeys).all(),
                ).toEqual(["brown", "red"]);
            });
        });
    });

    describe("intersectByKeys", () => {
        describe("Laravel Tests", () => {
            it("test intersect by keys null", () => {
                const c = collect({ name: "Mateus", age: 18 });
                expect(c.intersectByKeys(null).all()).toEqual({});

                const d = collect(["Mateus", 18]);
                expect(d.intersectByKeys(null).all()).toEqual([]);
            });

            it("test intersect by keys", () => {
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
    });

    describe("isEmpty", () => {
        describe("Laravel Tests", () => {
            it("", () => {
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
    });

    describe("containsOneItem", () => {
        it("Laravel Tests", () => {
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

    describe("join", () => {
        it("Laravel Tests", () => {
            expect(collect(["a", "b", "c"]).join(", ")).toBe("a, b, c");
            expect(collect(["a", "b", "c"]).join(", ", " and ")).toBe(
                "a, b and c",
            );
            expect(collect(["a", "b"]).join(", ", " and ")).toBe("a and b");
            expect(collect(["a"]).join(", ", " and ")).toBe("a");
            expect(collect([]).join(", ", " and ")).toBe("");
        });
    });

    describe("keys", () => {
        it("Laravel Tests", () => {
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
    });

    describe("last", () => {
        describe("Laravel Tests", () => {
            it("test last returns last item in collection", () => {
                const c = collect(["foo", "bar"]);
                expect(c.last()).toBe("bar");

                const c2 = collect([]);
                expect(c2.last()).toBeNull();
            });

            it("test last with callback", () => {
                const c = collect([100, 200, 300]);
                expect(c.last((value) => value < 250)).toBe(200);

                expect(c.last((_value, key) => key < 2)).toBe(200);

                expect(c.last((value) => value > 300)).toBeNull();
            });

            it("test last with default and without callback", () => {
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
    });

    describe("pluck", () => {
        describe("Laravel Tests", () => {
            it("test pluck with array and object values", () => {
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

            it("test pluck with dot notation", () => {
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
    });

    describe("map", () => {
        it("Laravel Tests", () => {
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
    });

    describe("mapToDictionary", () => {
        describe("Laravel Tests", () => {
            it("test map to dictionary", () => {
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

                const groups3 = data.mapToDictionary((item) => {
                    return [item.name, item.id];
                });

                expect(groups3.all()).toEqual({
                    A: [1],
                    B: [2, 4],
                    C: [3],
                });

                expect(() =>
                    data.mapToDictionary((item) => {
                        return [item.name];
                    }),
                ).toThrowError();

                expect(() =>
                    data.mapToDictionary((item) => {
                        return [item.name, item.id, "error"];
                    }),
                ).toThrowError();
            });

            it("test map to dictionary with numeric keys", () => {
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

                const groups3 = data.mapToDictionary((item, key) => {
                    return [item, key];
                });

                expect(groups3.all()).toEqual({
                    1: [0, 4],
                    2: [1, 3],
                    3: [2],
                });
            });
        });
    });

    describe("mapWithKeys", () => {
        describe("Laravel Tests", () => {
            it("test map with keys", () => {
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
            });

            it("test map with keys callback key", () => {
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
        });
    });

    describe("merge", () => {
        describe("Laravel Tests", () => {
            it("test merge null", () => {
                const c = collect({ name: "hello" });
                expect(c.merge(null).all()).toEqual({ name: "hello" });
            });

            it("test merge array", () => {
                const c = collect({ name: "Hello" });
                expect(c.merge({ id: 1 }).all()).toEqual({
                    name: "Hello",
                    id: 1,
                });

                const d = collect(["hello"]);
                expect(d.merge(1).all()).toEqual(["hello", 1]);
            });

            it("test merge collection", () => {
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

        it("merge object items with array", () => {
            const c = collect({ a: 1, b: 2 });
            expect(c.merge([3, 4]).all()).toEqual({
                "0": 3,
                "1": 4,
                a: 1,
                b: 2,
            });
        });
    });

    describe("mergeRecursive", () => {
        describe("Laravel Tests", () => {
            it("test merge recursive null", () => {
                const c = collect({ name: "hello" });
                expect(c.mergeRecursive(null).all()).toEqual({ name: "hello" });
            });

            it("test merge recursive array", () => {
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

        it("test target is array and source is not", () => {
            const target = collect({ a: [1, 2, 3] });
            const source = collect({ a: 4 });
            expect(target.mergeRecursive(source).all()).toEqual({
                a: [1, 2, 3, 4],
            });
        });

        it("test source is array and target is not", () => {
            const target = collect({ a: 7 });
            const source = collect({ a: [1, 2, 3] });
            expect(target.mergeRecursive(source).all()).toEqual({
                a: [7, 1, 2, 3],
            });
        });

        it("test merging existing keys and adding new keys", () => {
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
            expect(target.mergeRecursive(source).all()).toEqual([
                [1, 2],
                [4, 5, 7, 6, 8],
                {
                    b: [4, 5],
                    c: [5, 6],
                    d: [8, 9, 10, 11],
                    e: { x: [1, 3], y: 2, z: 4 },
                },
                3,
            ]);
        });

        it("test merging arrays when target array is longer than source", () => {
            const target = collect([1, [2, 3, 4], { a: 7, b: 8, c: 9 }]);
            const source = collect([5, [6]]);
            expect(target.mergeRecursive(source).all()).toEqual([
                [1, 5],
                [2, 3, 4, 6],
                { a: 7, b: 8, c: 9 },
            ]);
        });

        it("test merging object and arrays", () => {
            const target = collect({ a: 1, b: [2, 3], c: { x: 4, y: 5 } });
            const source = collect({ a: [6, 7], b: 4, c: { x: [8, 9] } });
            expect(target.mergeRecursive(source).all()).toEqual({
                a: [1, 6, 7],
                b: [2, 3, 4],
                c: { x: [4, 8, 9], y: 5 },
            });

            const target2 = collect({ a: 1, b: { x: 2, y: 3 }, c: [4, 5] });
            const source2 = collect([[6, 7], 4, { x: [8, 9] }]);
            expect(target2.mergeRecursive(source2).all()).toEqual({
                "0": [6, 7],
                "1": 4,
                "2": { x: [8, 9] },
                a: 1,
                b: { x: 2, y: 3 },
                c: [4, 5],
            });
        });
    });

    describe("multiply", () => {
        it("Laravel Tests", () => {
            const c = collect([
                "Hello",
                1,
                { tags: ["a", "b"], role: "admin" },
            ]);

            expect(c.multiply(-1).all()).toEqual([]);
            expect(c.multiply(0).all()).toEqual([]);

            expect(c.multiply(1).all()).toEqual([
                "Hello",
                1,
                { tags: ["a", "b"], role: "admin" },
            ]);

            expect(c.multiply(3).all()).toEqual([
                "Hello",
                1,
                { tags: ["a", "b"], role: "admin" },
                "Hello",
                1,
                { tags: ["a", "b"], role: "admin" },
                "Hello",
                1,
                { tags: ["a", "b"], role: "admin" },
            ]);
        });
    });

    describe("combine", () => {
        describe("Laravel Tests", () => {
            it("test combine with array", () => {
                const c = collect([1, 2, 3]);
                expect(c.combine([4, 5, 6]).all()).toEqual([
                    [1, 4],
                    [2, 5],
                    [3, 6],
                ]);

                const d = collect(["name", "family"]);
                expect(d.combine(["taylor", "otwell"]).all()).toEqual([
                    ["name", "taylor"],
                    ["family", "otwell"],
                ]);

                const e = collect({ 1: "name", 2: "family" });
                expect(e.combine({ 2: "taylor", 3: "otwell" }).all()).toEqual({
                    name: "taylor",
                    family: "otwell",
                });

                const f = collect({ 1: "name", 2: "family" });
                expect(f.combine({ 2: "taylor", 3: "otwell" }).all()).toEqual({
                    name: "taylor",
                    family: "otwell",
                });
            });

            it("test combine with collection", () => {
                const c = collect([1, 2, 3]);
                expect(c.combine(collect([4, 5, 6])).all()).toEqual([
                    [1, 4],
                    [2, 5],
                    [3, 6],
                ]);

                const f = collect({ 1: "name", 2: "family" });
                expect(
                    f.combine(collect({ 2: "taylor", 3: "otwell" })).all(),
                ).toEqual({
                    name: "taylor",
                    family: "otwell",
                });
            });
        });
    });

    describe("union", () => {
        describe("Laravel Tests", () => {
            it("test union null", () => {
                const c = collect({ name: "Hello" });
                expect(c.union(null).all()).toEqual({ name: "Hello" });
            });

            it("test union array", () => {
                const c = collect({ name: "Hello" });
                expect(c.union({ id: 1 }).all()).toEqual({
                    name: "Hello",
                    id: 1,
                });
            });

            it("test union collection", () => {
                const c = collect({ name: "Hello" });
                expect(
                    c.union(collect({ name: "World", id: 1 })).all(),
                ).toEqual({ name: "Hello", id: 1 });
            });
        });
    });

    describe("nth", () => {
        it("Laravel Tests", () => {
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
            expect(() => {
                collect([1, 2, 3]).nth(0);
            }).toThrowError("Step value must be at least 1.");
        });

        it("throws exception for negative step", () => {
            expect(() => {
                collect([1, 2, 3]).nth(-1);
            }).toThrowError("Step value must be at least 1.");
        });
    });

    describe("only", () => {
        it("Laravel Tests", () => {
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
    });

    describe("select", () => {
        describe("Laravel Tests", () => {
            it("test select with arrays", () => {
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

            it("test select with objects", () => {
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
        });
    });

    describe("pop", () => {
        describe("Laravel Tests", () => {
            it("test pop returns and removes last item in collection", () => {
                const c = collect(["foo", "bar"]);

                expect(c.pop()).toBe("bar");
                expect(c.first()).toBe("foo");
            });

            it("test pop returns and removes last x items in collection", () => {
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
    });

    describe("prepend", () => {
        it("Laravel Tests", () => {
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

            const c3 = collect({ one: 1, two: 2 });
            expect(c3.prepend(0, null).all()).toEqual({
                null: 0,
                one: 1,
                two: 2,
            });

            // In JavaScript, empty strings are valid object keys (unlike PHP where they convert to null)
            const c4 = collect({ one: 1, two: 2 });
            expect(c4.prepend(0, "").all()).toEqual({
                "": 0,
                one: 1,
                two: 2,
            });
        });
    });

    describe("push", () => {
        describe("Laravel Tests", () => {
            it("test push with one item", () => {
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
    });

    describe("unshift", () => {
        describe("Laravel Tests", () => {
            it("test unshift with one item", () => {
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
    });

    describe("concat", () => {
        describe("Laravel Tests", () => {
            it("test concat with array", () => {
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
    });

    describe("pull", () => {
        describe("Laravel Tests", () => {
            it("test pull retrieves item from collection", () => {
                const c = collect(["foo", "bar"]);

                expect(c.pull(0)).toBe("foo");
                expect(c.pull(1)).toBe("bar");

                const c2 = collect(["foo", "bar"]);

                expect(c2.pull(-1)).toBeNull();
                expect(c2.pull(2)).toBeNull();
            });

            it("test pull removes item from collection", () => {
                const c = collect(["foo", "bar"]);
                c.pull(0);
                expect(c.all()).toEqual({ 1: "bar" });
                c.pull(1);
                expect(c.all()).toEqual({});
            });

            it("test pull removes item from nested collection", () => {
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

            // Test pulling from array with simple numeric index (already covered but ensuring)
            const c9 = collect([10, 20, 30]);
            expect(c9.pull(1)).toBe(20);
            expect(c9.all()).toEqual({ 0: 10, 2: 30 });

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
        });
    });

    describe("put", () => {
        describe("Laravel Tests", () => {
            it("test put", () => {
                const data = collect({ name: "taylor", email: "foo" });
                data.put("name", "dayle");
                expect(data.all()).toEqual({ name: "dayle", email: "foo" });
            });

            it("test put with no key", () => {
                const data = collect(["taylor", "shawn"]);
                data.put(null, "dayle");
                expect(data.all()).toEqual(["taylor", "shawn", "dayle"]);
            });

            it("test put add item to collection", () => {
                const data = collect({});
                expect(data.toArray()).toEqual({});
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
    });

    describe("random", () => {
        describe("Laravel Tests", () => {
            it("test random", () => {
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
                const data = collect([]);
                const random = data.random(0);
                expect(random).toBeInstanceOf(Collection);
                expect(random.count()).toBe(0);

                const randomStringZero = data.random("0");
                expect(randomStringZero).toBeInstanceOf(Collection);
                expect(randomStringZero.count()).toBe(0);
            });

            it("test random throws an exception using amount bigger than collection size", () => {
                const data = collect([1, 2, 3]);
                expect(() => {
                    data.random(4);
                }).toThrowError();
            });
        });
    });

    describe("replace", () => {
        describe("Laravel Tests", () => {
            it("test replace null", () => {
                const c = collect(["a", "b", "c"]);
                expect(c.replace(null).all()).toEqual(["a", "b", "c"]);
            });

            it("test replace array", () => {
                const c = collect(["a", "b", "c"]);
                expect(c.replace(["d", "e"]).all()).toEqual(["d", "e", "c"]);

                const c2 = collect(["a", "b", "c"]);
                expect(c2.replace(["d", "e", "f", "g"]).all()).toEqual([
                    "d",
                    "e",
                    "f",
                    "g",
                ]);

                const c3 = collect({ name: "amir", family: "otwell" });
                expect(c3.replace({ name: "taylor", age: 26 }).all()).toEqual({
                    name: "taylor",
                    family: "otwell",
                    age: 26,
                });
            });

            it("test replace collection", () => {
                const c = collect(["a", "b", "c"]);
                expect(c.replace(collect(["d", "e"])).all()).toEqual([
                    "d",
                    "e",
                    "c",
                ]);

                const c2 = collect(["a", "b", "c"]);
                expect(c2.replace(collect(["d", "e", "f", "g"])).all()).toEqual(
                    ["d", "e", "f", "g"],
                );

                const c3 = collect({ name: "amir", family: "otwell" });
                expect(
                    c3.replace(collect({ name: "taylor", age: 26 })).all(),
                ).toEqual({ name: "taylor", family: "otwell", age: 26 });
            });
        });
    });

    describe("replaceRecursive", () => {
        describe("Laravel Tests", () => {
            it("test replace recursive null", () => {
                const c = collect(["a", "b", ["c", "d"]]);
                expect(c.replaceRecursive(null).all()).toEqual([
                    "a",
                    "b",
                    ["c", "d"],
                ]);
            });

            it("test replace recursive array", () => {
                const c = collect(["a", "b", ["c", "d"]]);
                expect(
                    c.replaceRecursive(["z", "b", ["c", "e"]]).all(),
                ).toEqual(["z", "b", ["c", "e"]]);

                const c2 = collect(["a", "b", ["c", "d"]]);
                expect(
                    c2.replaceRecursive(["z", "b", ["c", "e"], "f"]).all(),
                ).toEqual(["z", "b", ["c", "e"], "f"]);
            });

            it("test replace recursive collection", () => {
                const c = collect(["a", "b", ["c", "d"]]);
                expect(
                    c.replaceRecursive(collect(["z", "b", ["c", "e"]])).all(),
                ).toEqual(["z", "b", ["c", "e"]]);

                const c2 = collect(["a", "b", ["c", "d"]]);
                expect(
                    c2
                        .replaceRecursive(collect(["z", "b", ["c", "e"], "f"]))
                        .all(),
                ).toEqual(["z", "b", ["c", "e"], "f"]);
            });
        });
    });

    describe("reverse", () => {
        describe("Laravel Tests", () => {
            it("", () => {
                const data = collect(["zaeed", "alan"]);
                const reversed = data.reverse();

                expect(reversed.all()).toEqual(["alan", "zaeed"]);

                const data2 = collect({ name: "taylor", framework: "laravel" });
                const reversed2 = data2.reverse();

                expect(reversed2.all()).toEqual({
                    framework: "laravel",
                    name: "taylor",
                });
            });
        });
    });

    describe("search", () => {
        describe("Laravel Tests", () => {
            it("test search returns index of first found item", () => {
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
                // Note: In JavaScript, we must search for the same array reference
                // because strict comparison uses === which checks reference equality
                // for objects and arrays
                const emptyArray: unknown[] = [];
                const c = collect([false, 0, 1, emptyArray, ""]);

                expect(c.search("false", true)).toBe(false);
                expect(c.search("1", true)).toBe(false);
                expect(c.search(false, true)).toBe(0);
                expect(c.search(0, true)).toBe(1);
                expect(c.search(1, true)).toBe(2);
                expect(c.search(emptyArray, true)).toBe(3);
                expect(c.search("", true)).toBe(4);
            });

            it("test search returns false when item is not found", () => {
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
    });

    describe("before", () => {
        describe("Laravel Tests", () => {
            it("test before returns item before the given item", () => {
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

                // In JavaScript, object keys with numeric names are always ordered first,
                // so we cannot replicate PHP's behavior of ['foo' => 'bar', 1, 2, 3, 4, 5]
                // where 'foo' would be the first key. Instead, we test with all string keys.
                const c2 = collect({ a: "first", b: "second", c: "third" });
                expect(c2.before("first")).toBeNull();
            });
        });
    });

    describe("after", () => {
        describe("Laravel Tests", () => {
            it("test after returns item after the given item", () => {
                // $c = new $collection([1, 2, 3, 4, 2, 5, 'name' => 'taylor', 'framework' => 'laravel']);

                // $this->assertEquals(2, $c->after(1));
                // $this->assertEquals(3, $c->after(2));
                // $this->assertEquals(4, $c->after(3));
                // $this->assertEquals(2, $c->after(4));
                // $this->assertEquals('taylor', $c->after(5));
                // $this->assertEquals('laravel', $c->after('taylor'));

                // $this->assertEquals(4, $c->after(function ($value) {
                //     return $value > 2;
                // }));
                // $this->assertEquals('laravel', $c->after(function ($value) {
                //     return ! is_numeric($value);
                // }));

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

                // In JavaScript, object keys with numeric names are always ordered first,
                // so we cannot replicate PHP's behavior of ['foo' => 'bar', 1, 2, 3, 4, 5]
                // where '5' would be the last key. Instead, we test with all string keys.
                const c2 = collect({ a: "first", b: "second", c: "third" });
                expect(c2.after("third")).toBeNull();
            });
        });
    });

    describe("shift", () => {
        describe("Laravel Tests", () => {
            it("test shift returns and removes first item in collection", () => {
                const data = collect(["Taylor", "Otwell"]);

                expect(data.shift()).toBe("Taylor");
                expect(data.first()).toBe("Otwell");
                expect(data.shift()).toBe("Otwell");
                expect(data.first()).toBeNull();
            });

            it("test shift returns and removes first x items in collection", () => {
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
                }).toThrowError();

                expect(() => {
                    collect(["foo", "bar", "baz"]).shift(-2);
                }).toThrowError();
            });

            it("test shift returns null on empty collection", () => {
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

            // Test shift with array containing undefined
            const arrWithUndef = collect([undefined, 1, 2]);
            expect(arrWithUndef.shift()).toBeUndefined();
            expect(arrWithUndef.all()).toEqual([1, 2]);
        });
    });

    describe("shuffle", () => {
        it("test shuffle", () => {
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
    });

    describe("sliding", () => {
        describe("Laravel Tests", () => {
            it("test sliding", () => {
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

                // Ensure keys are preserved, and inner chunks are also collections
                const chunks = Collection.times(3).sliding();

                expect(chunks.toArray()).toEqual([
                    [1, 2],
                    [2, 3],
                ]);

                expect(chunks).toBeInstanceOf(Collection);
                expect(chunks.first()).toBeInstanceOf(Collection);
                expect(chunks.skip(1).first()).toBeInstanceOf(Collection);

                // Test invalid size parameter (size must be at least 1)
                expect(() =>
                    Collection.times(5).sliding(0, 1).toArray(),
                ).toThrow("Size value must be at least 1.");

                expect(() =>
                    Collection.times(5).sliding(-1, 1).toArray(),
                ).toThrow("Size value must be at least 1.");

                // Test invalid step parameter (step must be at least 1)
                expect(() =>
                    Collection.times(5).sliding(2, 0).toArray(),
                ).toThrow("Step value must be at least 1.");

                expect(() =>
                    Collection.times(5).sliding(2, -1).toArray(),
                ).toThrow("Step value must be at least 1.");
            });
        });
    });

    describe("skip", () => {
        describe("Laravel Tests", () => {
            it("test skip method", () => {
                const data = collect([1, 2, 3, 4, 5, 6]);

                // Total items to skip is smaller than collection length
                expect(data.skip(4).values().all()).toEqual([5, 6]);

                // Total items to skip is more than collection length
                expect(data.skip(10).values().all()).toEqual([]);
            });
        });
    });

    describe("slice", () => {
        describe("Laravel Tests", () => {
            it("test slice offset", () => {
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8]);
                expect(data.slice(3).values().all()).toEqual([4, 5, 6, 7, 8]);
            });

            it("test slice negative offset", () => {
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8]);
                expect(data.slice(-3).values().all()).toEqual([6, 7, 8]);
            });

            it("test slice offset and length", () => {
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8]);
                expect(data.slice(3, 3).values().all()).toEqual([4, 5, 6]);
            });

            it("test slice offset and negative length", () => {
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8]);
                expect(data.slice(3, -1).values().all()).toEqual([4, 5, 6, 7]);
            });

            it("test slice negative offset and length", () => {
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8]);
                expect(data.slice(-5, 3).values().all()).toEqual([4, 5, 6]);
            });

            it("test slice negative offset and negative length", () => {
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8]);
                expect(data.slice(-6, -2).values().all()).toEqual([3, 4, 5, 6]);
            });
        });
    });

    describe("split", () => {
        describe("Laravel Tests", () => {
            it("test split collection with a divisible count", () => {
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
                expect(() => {
                    collect([1, 2, 3]).split(0);
                }).toThrowError("Number of groups must be at least 1.");
            });

            it("throws exception for negative number of groups", () => {
                expect(() => {
                    collect([1, 2, 3]).split(-1);
                }).toThrowError("Number of groups must be at least 1.");
            });
        });
    });

    describe("splitIn", () => {
        describe("Laravel Tests", () => {
            it("test split in", () => {
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
                const split = data.splitIn(3);

                expect(split).toBeInstanceOf(Collection);
                expect(split.first()).toBeInstanceOf(Collection);
                expect(split.count()).toBe(3);
                expect(split.get(0)!.values().toArray()).toEqual([1, 2, 3, 4]);
                expect(split.get(1)!.values().toArray()).toEqual([5, 6, 7, 8]);
                expect(split.get(2)!.values().toArray()).toEqual([9, 10]);
            });

            it("throws exception for invalid number of groups", () => {
                expect(() => {
                    collect([1, 2, 3]).splitIn(0);
                }).toThrowError("Number of groups must be at least 1.");
            });

            it("throws exception for negative number of groups", () => {
                expect(() => {
                    collect([1, 2, 3]).splitIn(-1);
                }).toThrowError("Number of groups must be at least 1.");
            });
        });
    });

    describe("sole", () => {
        describe("Laravel Tests", () => {
            it("test sole returns first item in collection if only one exists", () => {
                const c = collect([{ name: "foo" }, { name: "bar" }]);

                expect(c.where("name", "foo").sole()).toEqual({ name: "foo" });
                expect(c.sole("name", "=", "foo")).toEqual({ name: "foo" });
                expect(c.sole("name", "foo")).toEqual({ name: "foo" });
            });

            it("test sole throws exception if no items exist", () => {
                const c = collect([{ name: "foo" }, { name: "bar" }]);

                expect(() => {
                    c.where("name", "INVALID").sole();
                }).toThrowError();
            });

            it("test sole throws exception if more than one item exists", () => {
                const c = collect([
                    { name: "foo" },
                    { name: "foo" },
                    { name: "bar" },
                ]);

                expect(() => {
                    c.where("name", "foo").sole();
                }).toThrowError();
            });

            it("test sole returns first item in collection if only one exists with callback", () => {
                const data = collect(["foo", "bar", "baz"]);

                const result = data.sole((value) => {
                    return value === "bar";
                });

                expect(result).toBe("bar");
            });

            it("test sole throws exception if no items exist with callback", () => {
                const data = collect(["foo", "bar", "baz"]);
                expect(() => {
                    data.sole((value) => {
                        return value === "invalid";
                    });
                }).toThrowError();
            });

            it("test solr throws exception if more than one item exists with callback", () => {
                const data = collect(["foo", "bar", "bar"]);

                expect(() => {
                    data.sole((value) => {
                        return value === "bar";
                    });
                }).toThrowError();
            });
        });
    });

    describe("firstOrFail", () => {
        describe("Laravel Tests", () => {
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

            it("test first or fail throws exception if no items exist", () => {
                const c = collect([{ name: "foo" }, { name: "bar" }]);

                expect(() => {
                    c.where("name", "INVALID").firstOrFail();
                }).toThrowError();
            });

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

            it("test first or fail returns first item in collection if only one exists with callback", () => {
                const data = collect(["foo", "bar", "baz"]);
                const result = data.firstOrFail((value) => {
                    return value === "bar";
                });
                expect(result).toBe("bar");
            });

            it("test first or fail throws exception if no items exist with callback", () => {
                const data = collect(["foo", "bar", "baz"]);

                expect(() => {
                    data.firstOrFail((value) => {
                        return value === "invalid";
                    });
                }).toThrowError();
            });

            it("test first or fail doesn't throw exception if more than one item exists with callback", () => {
                const data = collect(["foo", "bar", "bar"]);

                expect(
                    data.firstOrFail((value) => {
                        return value === "bar";
                    }),
                ).toBe("bar");
            });

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
    });

    describe("chunk", () => {
        describe("Laravel Tests", () => {
            it("test chunk", () => {
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
                const chunked = data.chunk(3);

                expect(chunked).toBeInstanceOf(Collection);
                expect(chunked.first()).toBeInstanceOf(Collection);
                expect(chunked.count()).toBe(4);
                expect(chunked.get(0)!.values().toArray()).toEqual([1, 2, 3]);
                expect(chunked.get(3)!.values().toArray()).toEqual([10]);
            });

            it("test chunk when given zero as size", () => {
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

                expect(data.chunk(0).toArray()).toEqual([]);
            });

            it("test chunck when given less than zero", () => {
                const data = collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

                expect(data.chunk(-1).toArray()).toEqual([]);
            });

            it("test chunk preserving keys", () => {
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
    });

    describe("sort", () => {
        describe("Laravel Tests", () => {
            it("test sort", () => {
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
        });
    });

    describe("sortDesc", () => {
        describe("Laravel Tests", () => {
            it("test sort desc", () => {
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
    });

    describe("sortBy", () => {
        describe("Laravel Tests", () => {
            it("test sort by", () => {
                const data = collect(["taylor", "dayle"]);
                const sorted = data.sortBy((x) => x);

                expect(sorted.values().all()).toEqual(["dayle", "taylor"]);

                const data2 = collect(["dayle", "taylor"]);
                const sorted2 = data2.sortByDesc((x) => x);

                expect(sorted2.values().all()).toEqual(["taylor", "dayle"]);
            });

            it("test sort by string", () => {
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
                const data = collect([{ sort: 2 }, { sort: 1 }]);
                const sorted = data.sortBy("sort");

                expect(sorted.values().all()).toEqual([
                    { sort: 1 },
                    { sort: 2 },
                ]);
            });

            it("test sort by callable string desc", () => {
                const data = collect([
                    { id: 1, name: "foo" },
                    { id: 2, name: "bar" },
                ]);
                const sorted = data.sortByDesc("id");

                const data2 = collect([
                    { id: 1, name: "foo" },
                    { id: 2, name: "bar" },
                    { id: 2, name: "baz" },
                ]);
                const sorted2 = data2.sortByDesc("id");

                expect(sorted.values().all()).toEqual([
                    { id: 2, name: "bar" },
                    { id: 1, name: "foo" },
                ]);

                expect(sorted2.values().all()).toEqual([
                    { id: 2, name: "bar" },
                    { id: 2, name: "baz" },
                    { id: 1, name: "foo" },
                ]);
            });

            it("test sort by always returns assoc", () => {
                const data = collect({ a: "taylor", b: "dayle" });
                const sorted = data.sortBy((x) => x);

                expect(sorted.all()).toEqual({ b: "dayle", a: "taylor" });

                const data2 = collect(["taylor", "dayle"]);
                const sorted2 = data2.sortBy((x) => x);

                expect(sorted2.all()).toEqual({ 1: "dayle", 0: "taylor" });

                const data3 = collect({ a: { sort: 2 }, b: { sort: 1 } });
                const sorted3 = data3.sortBy("sort");

                expect(sorted3.all()).toEqual({
                    b: { sort: 1 },
                    a: { sort: 2 },
                });

                const data4 = collect([{ sort: 2 }, { sort: 1 }]);
                const sorted4 = data4.sortBy("sort");

                expect(sorted4.all()).toEqual({
                    1: { sort: 1 },
                    0: { sort: 2 },
                });
            });
        });
    });

    describe("sort by many", () => {
        describe("Laravel Tests", () => {
            it("test sort by many", () => {
                // Test sorting with mixed types - JavaScript compares them all as strings
                const data = collect([
                    { item: "1" },
                    { item: "10" },
                    { item: 5 },
                    { item: 20 },
                ]);

                // Sort ascending by single field - all converted to strings for comparison
                // "1" < "10" < "20" < "5" (lexicographic order)
                const sorted1 = data.sortBy(["item"]);
                expect(sorted1.pluck("item").all()).toEqual(["1", "10", 5, 20]);

                // Sort descending by single field using global descending parameter
                // Note: sortByMany second parameter applies globally to all fields
                const sorted1Desc = data.sortByMany(["item"], true);
                const values = sorted1Desc.values().all() as {
                    item: string | number;
                }[];
                expect(values.map((v) => v.item)).toEqual([20, 5, "10", "1"]);

                // Test natural string sorting with numbers
                const data2 = collect([
                    { item: "img1" },
                    { item: "img101" },
                    { item: "img10" },
                    { item: "img11" },
                ]);

                const sorted2 = data2.sortBy(["item"]);
                // JavaScript sorts strings lexicographically
                expect(sorted2.pluck("item").all()).toEqual([
                    "img1",
                    "img101",
                    "img10",
                    "img11",
                ]);

                // Sort descending
                const sorted2Desc = data2.sortByMany(["item"], true);
                const values2 = sorted2Desc.values().all() as {
                    item: string;
                }[];
                expect(values2.map((v) => v.item)).toEqual([
                    "img11",
                    "img101",
                    "img10",
                    "img1",
                ]);

                // Test multi-level sorting
                const data3 = collect([
                    { first: "b", second: 2 },
                    { first: "a", second: 3 },
                    { first: "b", second: 1 },
                    { first: "a", second: 1 },
                ]);

                // Sort by first asc, then second asc
                const sorted3 = data3.sortBy(["first", "second"]);
                const values3 = sorted3.values().all();
                expect(values3).toEqual([
                    { first: "a", second: 1 },
                    { first: "a", second: 3 },
                    { first: "b", second: 1 },
                    { first: "b", second: 2 },
                ]); // Sort by first desc, then second desc (global descending)
                const sorted3Desc = data3.sortByMany(["first", "second"], true);
                expect(sorted3Desc.values().all()).toEqual([
                    { first: "b", second: 2 },
                    { first: "b", second: 1 },
                    { first: "a", second: 3 },
                    { first: "a", second: 1 },
                ]);

                // Test with null values
                const data4 = collect([
                    { first: "f", second: null },
                    { first: "f", second: "s" },
                    { first: "a", second: "z" },
                ]);

                // Nulls should sort first in ascending order
                const sorted4 = data4.sortBy(["first", "second"]);
                const values4 = sorted4.values().all();
                expect(values4).toEqual([
                    { first: "a", second: "z" },
                    { first: "f", second: null },
                    { first: "f", second: "s" },
                ]); // Nulls should sort last in descending order (comes first when values are swapped)
                const sorted4Desc = data4.sortByMany(["first", "second"], true);
                expect(sorted4Desc.values().all()).toEqual([
                    { first: "f", second: "s" },
                    { first: "f", second: null },
                    { first: "a", second: "z" },
                ]);
            });
        });

        it("sort by many coverage", () => {
            // Test empty comparison array throws error
            const data = collect([{ a: 1 }, { a: 2 }]);
            expect(() => data.sortByMany([])).toThrowError();

            // Test with function comparator returning numbers directly
            // This tests the path: if (!isString(prop) && isFunction(prop))
            const data2 = collect([{ value: 10 }, { value: 5 }, { value: 20 }]);

            const sorted = data2.sortByMany([(a, b) => a.value - b.value]);

            expect(sorted.pluck("value").all()).toEqual([10, 5, 20]);

            // Test numeric key handling - ensure hasNumericKeys path is covered
            const arrayData = collect([3, 1, 2]);
            const sortedArray = arrayData.sortByMany([(a, b) => a - b]);
            expect(sortedArray.all()).toEqual({
                "0": 3,
                "1": 1,
                "2": 2,
            });
        });
    });

    describe("sortKeys", () => {
        describe("Laravel Tests", () => {
            it("test sort keys", () => {
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

            // Test with numeric string keys
            const data2 = collect({ "3": "three", "1": "one", "2": "two" });
            expect(data2.sortKeys().all()).toEqual({
                "1": "one",
                "2": "two",
                "3": "three",
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
                const data = collect({ a: "taylor", b: "dayle" });

                expect(data.sortKeysDesc().all()).toEqual({
                    b: "dayle",
                    a: "taylor",
                });
            });
        });
    });

    describe("testSortKeysUsing", () => {
        describe("Laravel Tests", () => {
            it("test sort keys using", () => {
                const data = collect({ B: "dayle", a: "taylor" });

                expect(data.sortKeysUsing(strnatcasecmp).all()).toEqual({
                    a: "taylor",
                    B: "dayle",
                });
            });
        });
    });

    describe("splice", () => {
        describe("Laravel Tests", () => {
            it("test splice", () => {
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
    });

    describe("take", () => {
        describe("Laravel Tests", () => {
            it("test take", () => {
                const data = collect(["taylor", "dayle", "shawn"]);
                expect(data.take(2).all()).toEqual(["taylor", "dayle"]);
            });

            it("test take last", () => {
                const data = collect(["taylor", "dayle", "shawn"]);
                expect(data.take(-2).all()).toEqual(["dayle", "shawn"]);
            });
        });
    });

    describe("transform", () => {
        describe("Laravel Tests", () => {
            it("test transform", () => {
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
    });

    describe("undot", () => {
        describe("Laravel Tests", () => {
            it("test undot", () => {
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
    });

    describe("unique", () => {
        describe("Laravel Tests", () => {
            it("test unique", () => {
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
    });

    describe("values", () => {
        describe("Laravel Tests", () => {
            it("test values", () => {
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
    });

    describe("pad", () => {
        describe("Laravel Tests", () => {
            it("test pad", () => {
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
    });

    describe("getIterator", () => {
        describe("Laravel Tests", () => {
            it("test iterable", () => {
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
    });

    describe("count", () => {
        describe("Laravel Tests", () => {
            it("test countable", () => {
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

    describe("countBy", () => {
        describe("Laravel Tests", () => {
            it("test count by standalone", () => {
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

                const d = collect([true, true, false, false, false]);
                expect(d.countBy().all()).toEqual({ true: 2, false: 3 });

                const e = collect([1, 5, 1, 5, 5, 1]);
                expect(e.countBy().all()).toEqual({ 1: 3, 5: 3 });

                const f = collect(["James", "Joe", "Taylor"]);
                expect(f.countBy().all()).toEqual({
                    James: 1,
                    Joe: 1,
                    Taylor: 1,
                });
            });

            it("test count by with key", () => {
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
            });

            it("test count by with callback", () => {
                const c = collect([
                    "apple",
                    "apricot",
                    "banana",
                    "blueberry",
                    "cherry",
                ]);
                expect(c.countBy((item) => item.charAt(0)).all()).toEqual({
                    a: 2,
                    b: 2,
                    c: 1,
                });
            });
        });
    });

    describe("add", () => {
        describe("Laravel Tests", () => {
            it("test add", () => {
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
                c.add(3, 0);
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

        it("test add to objects", () => {
            const c = collect({});
            c.add(1, "a");
            expect(c.all()).toEqual({ a: 1 });
            c.add(2, "b");
            expect(c.all()).toEqual({ a: 1, b: 2 });
            c.add("", "c");
            expect(c.all()).toEqual({ a: 1, b: 2, c: "" });
            c.add(null, "d");
            expect(c.all()).toEqual({ a: 1, b: 2, c: "", d: null });
            c.add(false, "e");
            expect(c.all()).toEqual({ a: 1, b: 2, c: "", d: null, e: false });
            c.add([], "f");
            expect(c.all()).toEqual({
                a: 1,
                b: 2,
                c: "",
                d: null,
                e: false,
                f: [],
            });
            c.add("name", "g");
            expect(c.all()).toEqual({
                a: 1,
                b: 2,
                c: "",
                d: null,
                e: false,
                f: [],
                g: "name",
            });
            c.add(5, "a");
            expect(c.all()).toEqual({
                a: 5,
                b: 2,
                c: "",
                d: null,
                e: false,
                f: [],
                g: "name",
            });
            c.add("home");
            expect(c.all()).toEqual({
                a: 5,
                b: 2,
                c: "",
                d: null,
                e: false,
                f: [],
                g: "name",
                7: "home",
            });
        });
    });

    describe("offsetExists", () => {
        describe("Laravel Tests", () => {
            it("test offsetExists", () => {
                const c = collect({ a: "foo", b: "bar", c: null });
                expect(c.offsetExists("a")).toBe(true);
                expect(c.offsetExists("b")).toBe(true);
                expect(c.offsetExists("c")).toBe(false);

                const d = collect(["foo", "bar", null]);
                expect(d.offsetExists(0)).toBe(true);
                expect(d.offsetExists(1)).toBe(true);
                expect(d.offsetExists(2)).toBe(false);
            });
        });
    });

    describe("offsetGet", () => {
        describe("Laravel Tests", () => {
            it("test offset get", () => {
                const c = collect({ a: "foo", b: "bar" });
                expect(c.offsetGet("a")).toBe("foo");
                expect(c.offsetGet("b")).toBe("bar");

                const d = collect(["foo", "bar"]);
                expect(d.offsetGet(0)).toBe("foo");
                expect(d.offsetGet(1)).toBe("bar");
            });
        });
    });

    describe("offsetSet", () => {
        describe("Laravel Tests", () => {
            it("test offsetSet", () => {
                // TODO figure out how to test based on indexes directly on Collection like PHP does
                // $c = new Collection(['foo', 'foo']);

                // $c->offsetSet(1, 'bar');
                // $this->assertSame('bar', $c[1]);

                // $c->offsetSet(null, 'qux');
                // $this->assertSame('qux', $c[2]);

                const c = collect({ a: "foo", b: "foo" });

                c.offsetSet("b", "bar");
                expect(c.get("b")).toBe("bar");

                c.offsetSet(null, "qux");
                expect(c.get(2)).toBe("qux");

                const d = collect(["foo", "foo"]);

                d.offsetSet(1, "bar");
                expect(d.get(1)).toBe("bar");

                d.offsetSet(null, "qux");
                expect(d.get(2)).toBe("qux");
            });
        });
    });

    describe("offsetUnset", () => {
        describe("Laravel Tests", () => {
            it("test offsetUnset", () => {
                const c = collect({ a: "foo", b: "bar" });
                c.offsetUnset("b");
                expect(c.offsetExists("b")).toBe(false);

                const d = collect(["foo", "bar"]);
                d.offsetUnset(1);
                expect(d.offsetExists(1)).toBe(false);
            });
        });
    });

    describe("make", () => {
        describe("Laravel Tests", () => {
            it("test make method", () => {
                const data = Collection.make("foo");
                expect(data.all()).toEqual(["foo"]);
            });

            it("test make method from null", () => {
                const data = Collection.make(null);
                expect(data.all()).toEqual([]);

                const data2 = Collection.make();
                expect(data2.all()).toEqual([]);
            });

            it("test make method from collection", () => {
                const firstCollection = Collection.make({ foo: "bar" });
                const secondCollection = Collection.make(firstCollection);
                expect(secondCollection.all()).toEqual({ foo: "bar" });
            });

            it("test make method from array", () => {
                const data = Collection.make({ foo: "bar" });
                expect(data.all()).toEqual({ foo: "bar" });

                const data2 = Collection.make(["foo", "bar"]);
                expect(data2.all()).toEqual(["foo", "bar"]);
            });
        });
    });

    describe("wrap", () => {
        describe("Laravel Tests", () => {
            it("test wrap with scalar", () => {
                const data = Collection.wrap("foo");
                expect(data.all()).toEqual(["foo"]);
            });

            it("test wrap with array", () => {
                const data = Collection.wrap(["foo"]);
                expect(data.all()).toEqual(["foo"]);
            });

            it("test wrap with arrayable", () => {
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
                const innerCollection = Collection.make(["foo"]);
                const data = Collection.wrap(innerCollection);
                expect(data.all()).toEqual(["foo"]);
            });

            it("test wrap with collection sub class", () => {
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
    });

    describe("unwrap", () => {
        describe("Laravel Tests", () => {
            it("test unwrap collection", () => {
                const data = new Collection(["foo"]);
                expect(Collection.unwrap(data)).toEqual(["foo"]);
            });

            it("test unwrap collection with array", () => {
                expect(Collection.unwrap(["foo"])).toEqual(["foo"]);
            });

            it("test unwrap collection with scalar", () => {
                expect(Collection.unwrap("foo")).toBe("foo");
            });
        });
    });

    describe("empty", () => {
        describe("Laravel Tests", () => {
            it("test empty method", () => {
                const c = Collection.empty();
                expect(c.count()).toBe(0);
                expect(c.all()).toEqual([]);

                const d = Collection.empty(false);
                expect(d.count()).toBe(0);
                expect(d.all()).toEqual({});
            });

            it("test empty collection is empty", () => {
                const c = new Collection();
                expect(c.isEmpty()).toBe(true);
            });

            it("test empty collection is not empty", () => {
                const c = new Collection(["foo", "bar"]);
                expect(c.isEmpty()).toBe(false);
                expect(c.isNotEmpty()).toBe(true);
            });
        });
    });

    describe("times", () => {
        describe("Laravel Tests", () => {
            it("test times method", () => {
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
    });

    describe("fromJson", () => {
        describe("Laravel Tests", () => {
            it("test from json", () => {
                const json = JSON.stringify({ foo: "bar", baz: "quz" });

                const instance = Collection.fromJson(json);

                expect(instance.all()).toEqual({ foo: "bar", baz: "quz" });
            });
        });
    });

    describe("avg", () => {
        describe("Laravel Tests", () => {
            it("test getting avg items from collection", () => {
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
    });

    describe("average", () => {
        describe("Laravel Tests", () => {
            it("test average method", () => {
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
                expect(
                    d.average((item) => {
                        return item.foo;
                    }),
                ).toBe(15);
                expect(d.average("foo")).toBe(15);
                expect(
                    d.average((item) => {
                        return item.foo;
                    }),
                ).toBe(15);

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
    });

    describe("some", () => {
        describe("Laravel Tests", () => {
            it("test some", () => {
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
    });

    describe("each", () => {
        describe("Laravel Tests", () => {
            it("test each", () => {
                const c = collect([1, 2, { foo: "bar" }, { bam: "baz" }]);

                let result: unknown[] = [];
                c.each((item, key) => {
                    result[key] = item;
                });
                expect(result).toEqual([1, 2, { foo: "bar" }, { bam: "baz" }]);

                result = [];
                c.each((item, key) => {
                    result[key] = item;
                    if (typeof key === "string") {
                        return false;
                    }
                    return;
                });
                expect(result).toEqual([1, 2, { foo: "bar" }]);
            });

            it("test each spread", () => {
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
    });

    describe("eachSpread", () => {
        describe("Laravel Tests", () => {
            it("test each spread", () => {
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
                const c = collect([]);
                expect(c.every("key", "value")).toBe(true);
                expect(
                    c.every(() => {
                        return false;
                    }),
                ).toBe(true);

                const d = collect([{ age: 18 }, { age: 20 }, { age: 20 }]);
                expect(d.every("age", 18)).toBe(false);
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
    });

    describe("firstWhere", () => {
        describe("Laravel Tests", () => {
            it("test first where", () => {
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
        });
    });

    describe("value", () => {
        describe("Laravel Tests", () => {
            it("test value", () => {
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

            it("test value with negative value", () => {
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
    });

    describe("ensure", () => {
        describe("Laravel Tests", () => {
            it("test ensure for scalar", () => {
                const data = collect([1, 2, 3]);
                data.ensure("number");

                const data2 = collect([1, 2, 3, "foo"]);
                expect(() => {
                    data2.ensure("number");
                }).toThrowError();
            });

            it("test ensure for objects", () => {
                const data = collect([{}, {}, {}]);
                data.ensure("object");

                const data2 = collect([{}, {}, {}, collect([])]);
                expect(() => {
                    data2.ensure("object");
                }).toThrowError();
            });

            it("test ensure for inheritance", () => {
                const data = collect([new Error(), new Error()]);
                data.ensure("object");

                const wrongType = collect([]);
                const data2 = collect([new Error(), new Error(), wrongType]);
                expect(() => {
                    data2.ensure("object");
                }).toThrowError();
            });

            it("test ensure for multiple types", () => {
                const data = collect([new Error(), 123]);
                data.ensure(["object", "number"]);

                const wrongType = collect([]);
                const data2 = collect([new Error(), new Error(), wrongType]);
                expect(() => {
                    data2.ensure(["object", "number"]);
                }).toThrowError();
            });
        });
    });

    describe("mapSpread", () => {
        describe("Laravel Tests", () => {
            it("test map spread", () => {
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
    });

    describe("mapToGroups", () => {
        describe("Laravel Tests", () => {
            it("test map to groups", () => {
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
    });

    describe("mapInto", () => {
        describe("Laravel Tests", () => {
            it("test map into", () => {
                const data = collect(["first", "second"]);

                const mapped = data.mapInto(TestCollectionMapIntoObject);
                expect(mapped.all()).toEqual([
                    new TestCollectionMapIntoObject("first"),
                    new TestCollectionMapIntoObject("second"),
                ]);

                expect(mapped.get(0)!.value).toBe("first");
                expect(mapped.get(1)!.value).toBe("second");
            });
        });
    });

    describe("min", () => {
        describe("Laravel Tests", () => {
            it("test min", () => {
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
    });

    describe("max", () => {
        describe("Laravel Tests", () => {
            it("test max", () => {
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
    });

    describe("forPage", () => {
        describe("Laravel Tests", () => {
            it("test paginate", () => {
                const c = collect(["one", "two", "three", "four"]);
                expect(c.forPage(0, 2).all()).toEqual(["one", "two"]);
                expect(c.forPage(1, 2).all()).toEqual(["one", "two"]);
                expect(c.forPage(2, 2).all()).toEqual(["three", "four"]);
                expect(c.forPage(3, 2).all()).toEqual([]);
            });
        });
    });

    describe("partition", () => {
        describe("Laravel Tests", () => {
            it("test partition", () => {
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
    });

    describe("percentage", () => {
        describe("Laravel Tests", () => {
            it("test percentage with flat collection", () => {
                const c = collect([1, 1, 2, 2, 2, 3]);

                expect(
                    parseFloat(
                        c.percentage((value) => value === 1)?.toFixed(2) || "0",
                    ),
                ).toBe(33.33);
                expect(
                    parseFloat(
                        c.percentage((value) => value === 2)?.toFixed(2) || "0",
                    ),
                ).toBe(50.0);
                expect(
                    parseFloat(
                        c.percentage((value) => value === 3)?.toFixed(2) || "0",
                    ),
                ).toBe(16.67);
                expect(
                    parseFloat(
                        c.percentage((value) => value === 5)?.toFixed(2) || "0",
                    ),
                ).toBe(0.0);
            });

            it("test percetage with nested collection", () => {
                const c = collect([
                    { name: "Taylor", foo: "foo" },
                    { name: "Nuno", foo: "bar" },
                    { name: "Dries", foo: "bar" },
                    { name: "Jess", foo: "baz" },
                ]);

                expect(
                    parseFloat(
                        c
                            .percentage((value) => value.foo === "foo")
                            ?.toFixed(2) || "0",
                    ),
                ).toBe(25.0);
                expect(
                    parseFloat(
                        c
                            .percentage((value) => value.foo === "bar")
                            ?.toFixed(2) || "0",
                    ),
                ).toBe(50.0);
                expect(
                    parseFloat(
                        c
                            .percentage((value) => value.foo === "baz")
                            ?.toFixed(2) || "0",
                    ),
                ).toBe(25.0);
                expect(
                    parseFloat(
                        c
                            .percentage((value) => value.foo === "test")
                            ?.toFixed(2) || "0",
                    ),
                ).toBe(0.0);
            });

            it("test percentage returns null for empty collections", () => {
                const c = collect([]);

                expect(c.percentage((value) => value === 1)).toBeNull();
            });
        });
    });

    describe("sum", () => {
        describe("Laravel Tests", () => {
            it("test sum from from collection", () => {
                const c = collect([{ foo: 50 }, { foo: 50 }]);
                expect(
                    c.sum((item) => {
                        return item.foo;
                    }),
                ).toBe(100);

                const d = collect([{ foo: 50 }, { foo: 50 }]);
                expect(
                    d.sum((item) => {
                        return item.foo;
                    }),
                ).toBe(100);
            });

            it("test can sum values without a callback", () => {
                const c = collect([1, 2, 3, 4, 5]);
                expect(c.sum()).toBe(15);
            });

            it("test getting sum from empty collection", () => {
                const c = collect();
                expect(c.sum("foo")).toBe(0);
            });
        });
    });

    describe("whenEmpty", () => {
        describe("Laravel Tests", () => {
            it("test when empty", () => {
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
    });

    describe("whenNotEmpty", () => {
        describe("Laravel Tests", () => {
            it("test when not empty", () => {
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
    });

    describe("unlessEmpty", () => {
        describe("Laravel Tests", () => {
            it("test unless empty", () => {
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

                const object = { foo: "bar" };

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
    });

    describe("whereNull", () => {
        describe("Laravel Tests", () => {
            it("test where null", () => {
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
                const collection = collect([1, null, 3, "null", false, true]);

                expect(collection.whereNull().all()).toEqual([null]);
            });
        });
    });

    describe("whereNotNull", () => {
        describe("Laravel Tests", () => {
            it("test where not null", () => {
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
    });

    describe("whereStrict", () => {
        describe("Laravel Tests", () => {
            it("test where strict", () => {
                const c = collect([{ v: 3 }, { v: "3" }]);

                expect(c.whereStrict("v", 3).values().all()).toEqual([
                    { v: 3 },
                ]);
            });
        });
    });

    describe("whereIn", () => {
        describe("Laravel Tests", () => {
            it("test where in", () => {
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
    });

    describe("whereInStrict", () => {
        describe("Laravel Tests", () => {
            it("test where in strict", () => {
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
    });

    describe("whereBetween", () => {
        describe("Laravel Tests", () => {
            it("test where between", () => {
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
    });

    describe("whereNotBetween", () => {
        describe("Laravel Tests", () => {
            it("test where not between", () => {
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
    });

    describe("whereNotIn", () => {
        describe("Laravel Tests", () => {
            it("test where not in", () => {
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
    });

    describe("whereNotInStrict", () => {
        describe("Laravel Tests", () => {
            it("test where not in strict", () => {
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
    });

    describe("whereInstanceOf", () => {
        describe("Laravel Tests", () => {
            it("test where instance of", () => {
                const c = collect([
                    {},
                    {},
                    collect([]),
                    {},
                    new Stringable("example"),
                ]);

                expect(
                    (c.whereInstanceOf(Object).all() as unknown[]).length,
                ).toBe(5);

                expect(
                    (c.whereInstanceOf([Collection]).all() as unknown[]).length,
                ).toBe(1);

                expect(
                    (c.whereInstanceOf([Stringable]).all() as unknown[]).length,
                ).toBe(1);
            });
        });
    });

    describe("pipe", () => {
        describe("Laravel Tests", () => {
            it("test pipe", () => {
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
    });

    describe("reduce", () => {
        describe("Laravel Tests", () => {
            it("test reduce", () => {
                const data = collect([1, 2, 3]);

                expect(
                    data.reduce((carry, element) => {
                        return carry + element;
                    }),
                ).toBe(6);

                expect(
                    data.reduce((carry, element, key) => {
                        return (carry += element + key);
                    }),
                ).toBe(9);

                const data2 = collect({ foo: "bar", baz: "qux" });

                // Using initial value is the clean approach when you need all keys processed
                expect(
                    data2.reduce((carry, element, key) => {
                        return carry + key + element;
                    }, ""),
                ).toBe("foobarbazqux");
            });
        });
    });

    describe("reduceSpread", () => {
        describe("Laravel Tests", () => {
            it("test reduce spread", () => {
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
                const data = collect([1]);

                expect(() => {
                    // @ts-expect-error - intentionally passing wrong callback type
                    data.reduceSpread(() => {
                        return false;
                    }, null);
                }).toThrow(Error);
            });
        });
    });

    describe("reduceWithKeys", () => {
        describe("Laravel Tests", () => {
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
    });

    describe("reject", () => {
        describe("Laravel Tests", () => {
            it("test reject removes elements passing truth test", () => {
                const c = collect(["foo", "bar"]);
                expect(
                    c
                        .reject((v) => v === "bar")
                        .values()
                        .all(),
                ).toEqual(["foo"]);

                const d = collect(["foo", "bar"]);
                expect(
                    d
                        .reject((v) => v === "bar")
                        .values()
                        .all(),
                ).toEqual(["foo"]);

                const e = collect(["foo", null]);
                expect(
                    e
                        .reject((v) => v === null)
                        .values()
                        .all(),
                ).toEqual(["foo"]);

                const f = collect(["foo", "bar"]);
                expect(
                    f
                        .reject((v) => v === "baz")
                        .values()
                        .all(),
                ).toEqual(["foo", "bar"]);

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
    });

    describe("tap", () => {
        describe("Laravel Tests", () => {
            it("test tap", () => {
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
    });

    describe("collect", () => {
        describe("Laravel Tests", () => {
            it("test collect", () => {
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
    });

    describe("toArray", () => {
        it("test to array", () => {
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

                expect(c.jsonSerialize()).toEqual([
                    [{ foo: "bar" }],
                    { foo: "bar" },
                    { foo: "bar" },
                    "foobar",
                    "baz",
                ]);
            });
        });

        it("jsonSerialize handles Jsonable with toJSON only", () => {
            class ToJSONOnly {
                toJSON() {
                    return { foo: "bar" };
                }
            }

            const c = collect([new ToJSONOnly()]);
            expect(c.jsonSerialize()).toEqual([{ foo: "bar" }]);
        });

        it("jsonSerialize handles invalid JSON string from toJson", () => {
            class BadJsonable {
                toJson() {
                    return "not-json";
                }
            }

            const c = collect([new BadJsonable()]);
            expect(c.jsonSerialize()).toEqual(["not-json"]);
        });

        it("jsonSerialize handles Jsonable toJson returning object", () => {
            class ToJsonReturnsObject {
                toJson() {
                    return { x: 1, y: "z" };
                }
            }

            const c = collect([new ToJsonReturnsObject()]);
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
            expect(c.jsonSerialize()).toEqual(input);
        });

        //
    });

    describe("toJson", () => {
        it("toJson returns serialized items by default", () => {
            const c = collect([
                new TestArrayableObject(),
                new TestJsonableObject(),
                new TestJsonSerializeObject(),
                new TestJsonSerializeToStringObject(),
                "baz",
            ]);

            const json = c.toJson();
            expect(json).toBe(
                JSON.stringify([
                    [{ foo: "bar" }],
                    { foo: "bar" },
                    { foo: "bar" },
                    "foobar",
                    "baz",
                ]),
            );
        });

        it("toJson supports pretty printing with space", () => {
            const c = collect([{ a: 1 }, { b: 2 }]);
            const json = c.toJson(undefined, 2);
            expect(json).toBe(
                JSON.stringify([{ a: 1 }, { b: 2 }], undefined, 2),
            );
        });

        it("toJson with array replacer filters keys", () => {
            const c = collect([{ a: 1, b: 2 }, { b: 3 }]);
            const replacer: (string | number)[] = ["b"]; // keep only key 'b'
            const json = c.toJson(replacer);
            expect(json).toBe(JSON.stringify(c.jsonSerialize(), replacer));
        });

        it("toJson with function replacer transforms values", () => {
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
            const c = collect([{ a: 1, b: 2 }, { b: 3 }]);
            const jsonNull = c.toJson(null);
            const jsonDefault = c.toJson();
            expect(jsonNull).toBe(jsonDefault);
        });
    });

    describe("toPrettyJson", () => {
        it("returns pretty-printed JSON by default (4 spaces)", () => {
            const c = collect([
                new TestArrayableObject(),
                new TestJsonableObject(),
                new TestJsonSerializeObject(),
                new TestJsonSerializeToStringObject(),
                "baz",
            ]);

            const pretty = c.toPrettyJson();
            const expected = JSON.stringify(
                [
                    [{ foo: "bar" }],
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
            const c = collect([
                { a: 1, b: 2 },
                { b: 3, c: 4 },
            ]);
            const replacer: (string | number)[] = ["b"]; // keep only key 'b'
            const pretty = c.toPrettyJson(replacer, 2);
            expect(pretty).toBe(JSON.stringify(c.jsonSerialize(), replacer, 2));
        });

        it("supports function replacer to transform values", () => {
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
            const c = collect([{ a: 1, b: 2 }, { b: 3 }]);
            const prettyNull = c.toPrettyJson(null, 2);
            const prettyDefault = c.toPrettyJson(undefined, 2);
            expect(prettyNull).toBe(prettyDefault);
        });
    });

    describe("toString", () => {
        it("toString returns same output as toJson()", () => {
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

        it("toString reflects changes after set operations", () => {
            const c = collect({ a: 1 });
            c.set("b", 2);
            const expected = JSON.stringify({ a: 1, b: 2 });
            expect(c.toString()).toBe(expected);
        });
    });
});
