import { collect, Collection } from "@laravel-js/collection";
import object from "lodash-es/object";
import { assertType, describe, expect, it } from "vitest";

describe("Collection", () => {
    describe("assert constructor types", () => {
        it("arrays", () => {
            const arrColl = collect([{ foo: 1 }, { try: 5 }]);

            assertType<Collection<[{ foo: number }, { try: number }], number>>(
                arrColl,
            );

            const arr = new Collection([{ foo: 1 }, { try: 5 }]);

            assertType<Collection<[{ foo: number }, { try: number }], number>>(
                arr,
            );

            const fromCollection = collect(arrColl);
            assertType<Collection<[{ foo: number }, { try: number }], number>>(
                fromCollection,
            );
        });

        it("objects", () => {
            const objColl = collect({ foo: 1 });
            assertType<Collection<{ foo: number }, string>>(objColl);

            const obj = new Collection({ foo: 1 });
            assertType<Collection<{ foo: number }, string>>(obj);

            const fromCollection = collect(objColl);
            assertType<Collection<{ foo: number }, string>>(fromCollection);

            const objColl2 = collect({ 1: "a", 2: "b" });
            assertType<Collection<{ 1: string; 2: string }, string>>(objColl2);

            const obj2 = new Collection({ 1: "a", 2: "b" });
            assertType<Collection<{ 1: string; 2: string }, string>>(obj2);

            const fromCollection2 = collect(objColl2);
            assertType<Collection<{ 1: string; 2: string }, string>>(
                fromCollection2,
            );
        });

        it("arrayable", () => {
            const arrayable = {
                toArray: () => [4, 5, 6],
            };
            const collection = collect(arrayable);
            assertType<Collection<number[], number>>(collection);

            const collection2 = new Collection(arrayable);
            assertType<Collection<number[], number>>(collection2);

            const fromCollection = collect(collection);
            assertType<Collection<number[], number>>(fromCollection);
        });

        it("null and undefined", () => {
            const collection = collect(null);
            assertType<Collection<[], number>>(collection);

            const collection2 = new Collection(null);
            assertType<Collection<[], number>>(collection2);

            const fromCollection = collect(collection);
            assertType<Collection<[], number>>(fromCollection);
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
            expect(collection.median()).toEqual({
                age: 30,
                value: 3,
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
            // @ts-expect-error testing various falsy values
            expect(e.contains(false)).toBe(true);
            expect(e.contains(null)).toBe(true);
            // @ts-expect-error testing various falsy values
            expect(e.contains([])).toBe(true);
            expect(e.contains(0)).toBe(true);
            expect(e.contains("")).toBe(true);

            const f = collect([0]);
            expect(f.contains(0)).toBe(true);
            expect(f.contains("0")).toBe(true);
            // @ts-expect-error testing various falsy values
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

    describe("diff", () => {
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

    describe("filter", () => {
        it("filters array with callback", () => {
            const collection = collect<number>([1, 2, 3, 4]);
            const filtered = collection.filter((x) => x > 2);
            expect(filtered.all()).toEqual([3, 4]);
        });

        it("filters object with callback", () => {
            const collection = collect<number>({ a: 1, b: 2, c: 3, d: 4 });
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

    describe("isEmpty", () => {
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

    describe("count", () => {
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

    describe("keys", () => {
        it("returns collection of object keys", () => {
            const collection = collect({ a: 1, b: 2, c: 3 });
            expect(collection.keys().all()).toEqual(["a", "b", "c"]);
        });

        it("returns collection of numeric keys for array", () => {
            const collection = collect([1, 2, 3]);
            expect(collection.keys().all()).toEqual([0, 1, 2]);
        });
    });

    describe("values", () => {
        it("returns collection of values with object keys", () => {
            const collection = collect({ a: 1, b: 2, c: 3 });
            expect(collection.values().all()).toEqual([1, 2, 3]);
        });

        it("returns collection of values with numeric keys", () => {
            const collection = collect([1, 2, 3]);
            expect(collection.values().all()).toEqual([1, 2, 3]);
        });
    });

    describe("map", () => {
        it("transforms each array item", () => {
            const collection = collect<number>([1, 2, 3]);
            const mapped = collection.map((x) => x * 2);
            expect(mapped.all()).toEqual([2, 4, 6]);
        });

        it("transforms each object item", () => {
            const collection = collect<number>({ a: 1, b: 2, c: 3 });
            const mapped = collection.map(
                (value, key) => `${String(key)}:${value * 2}`,
            );
            expect(mapped.all()).toEqual({ a: "a:2", b: "b:4", c: "c:6" });
        });
    });

    describe("pluck", () => {
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

    describe("last", () => {
        it("returns last array item", () => {
            const collection = collect([1, 2, 3]);
            expect(collection.last()).toBe(3);
        });

        it("returns last object item", () => {
            const collection = collect({ a: 1, b: 2, c: 3 });
            expect(collection.last()).toBe(3);
        });

        it("returns last array item matching callback", () => {
            const collection = collect<number>([1, 2, 3, 4]);
            expect(collection.last((x) => x < 4)).toBe(3);
        });

        it("returns last object item matching callback", () => {
            const collection = collect<number>({ a: 1, b: 2, c: 3, d: 4 });
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

    describe("has", () => {
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
});
