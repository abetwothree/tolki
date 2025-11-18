import { collect, Collection } from "@laravel-js/collection";
import { Stringable } from "@laravel-js/str";
import object from "lodash-es/object";
import { assertType, describe, expect, it } from "vitest";

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

        it("map", () => {
            const data = collect(
                new Map([
                    [3, { id: 1, name: "A" }],
                    [5, { id: 3, name: "B" }],
                    [4, { id: 2, name: "C" }],
                ])
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
                ])
            );
            expect(data.all()).toEqual({
                3: { id: 1, name: "A" },
                5: { id: 3, name: "B" },
                4: { id: 2, name: "C" },
            });
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
            expect(c.containsStrict((item) => item < 5)).toBe(true);
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
            expect(c.doesntContainStrict((item) => item < 5)).toBe(false);
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
            expect(c3.filter((item, key) => key !== "id").all()).toEqual({
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
                expect(c.intersect(collect({ first_word: "Hello", last_word: "World" })).all()).toEqual({
                    first_word: "Hello",
                });
            });
        });
    })

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
                    c.intersectUsing(
                        collect(["GREEN", "brown", "yellow"]),
                        strcasecmp,
                    ).all(),
                ).toEqual(["green", "brown"]);
            });
        })
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
                const array1 = collect([
                    "green",
                    "brown",
                    "blue",
                    "red",
                ]);

                expect(array1.intersectAssoc(null).all()).toEqual([]);
            });

            it("test intersect assoc array collection", () => {
                const array1 = collect([
                    "green",
                    "brown",
                    "blue",
                    "red",
                ]);
                const array2 = collect([
                    "green",
                    "yellow",
                    "blue",
                    "red",
                ]);

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
                    array1
                        .intersectAssocUsing(array2, strcasecmpKeys)
                        .all(),
                ).toEqual({ b: "brown" });
            });
        });

        describe("test intersect assoc using with arrays", () => {
            it("test intersect assoc using with arrays with null", () => {
                const array1 = collect([
                    "green",
                    "brown",
                    "blue",
                    "red",
                ]);

                expect(
                    array1.intersectAssocUsing(null, strcasecmpKeys).all(),
                ).toEqual([]);
            });

            it("test intersect assoc using with arrays collection", () => {
                const array1 = collect([
                    "green",
                    "brown",
                    "blue",
                    "red",
                ]);
                const array2 = collect([
                    "GREEN",
                    "brown",
                    "yellow",
                    "red",
                ]);

                expect(
                    array1
                        .intersectAssocUsing(array2, strcasecmpKeys)
                        .all(),
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
                    c.intersectByKeys(
                        collect({ name: "Mateus", surname: "Guimaraes" }),
                    ).all(),
                ).toEqual({ name: "Mateus" });
            });

            it("test intersect by keys with different values", () => {
                const c = collect({ name: "taylor", family: "otwell", age: 26 });
                expect(
                    c.intersectByKeys(
                        collect({ height: 180, name: "amir", family: "moharami" }),
                    ).all(),
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
            expect(collect({a: 1}).containsOneItem()).toBe(true);
            expect(collect({a: 1, b: 2}).containsOneItem()).toBe(false);

            expect(collect([1, 2, 2]).containsOneItem((number) => number === 2)).toBe(false);
            expect(collect(["ant", "bear", "cat"]).containsOneItem((word) => word.length === 4)).toBe(true);
            expect(collect(["ant", "bear", "cat"]).containsOneItem((word) => word.length > 4)).toBe(false);

            expect(collect({a: 1, b: 2, c: 2}).containsOneItem((number) => number === 2)).toBe(false);
            expect(collect({a: "ant", b: "bear", c: "cat"}).containsOneItem((word) => word.length === 4)).toBe(true);
            expect(collect({a: "ant", b: "bear", c: "cat"}).containsOneItem((word) => word.length > 4)).toBe(false);
        });
    });
    
    describe("join", () => {
        it("Laravel Tests", () => {
            expect(collect(['a', 'b', 'c']).join(', ')).toBe('a, b, c');
            expect(collect(['a', 'b', 'c']).join(', ', ' and ')).toBe('a, b and c');
            expect(collect(['a', 'b']).join(', ', ' and ')).toBe('a and b');
            expect(collect(['a']).join(', ', ' and ')).toBe('a');
            expect(collect([]).join(', ', ' and ')).toBe('');
        });
    });

    describe("keys", () => {
        it("Laravel Tests", () => {
            const c = collect({ name: "taylor", framework: "laravel" });
            expect(c.keys().all()).toEqual(["name", "framework"]);

            const c2 = collect(["taylor", "laravel"]);;
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
            it("test last returns last item in collection" , () => {
                const c = collect(['foo', 'bar']);
                expect(c.last()).toBe('bar');

                const c2 = collect([]);
                expect(c2.last()).toBeNull();
            });

            it("test last with callback", () => {
                const c = collect([100, 200, 300]);
                expect(
                    c.last((value) => value < 250),
                ).toBe(200);

                expect(
                    c.last((value, key) => key < 2),
                ).toBe(200);

                expect(
                    c.last((value) => value > 300),
                ).toBeNull();
            });

            it("test last with default and without callback", () => {
                const c = collect(['foo', 'bar']);
                expect(
                    c.last((value) => value === 'baz', 'default'),
                ).toBe('default');

                const c2 = collect(['foo', 'bar', 'Bar']);
                expect(
                    c2.last((value) => value === 'bar', 'default'),
                ).toBe('bar');
            });

            it("test last with default and without callback", () => {
                const c = collect();
                expect(
                    c.last(null, 'default'),
                ).toBe('default');
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
                    data
                        .pluck((row) => `${row.name} (verified)`)
                        .all(),
                ).toEqual(["amir (verified)", "taylor (verified)"]);

                expect(
                    data
                        .pluck(
                            "name",
                            (row) => row.skill.backend.join("/"),
                        )
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
            const mapped2 = data2.map((item, key) => `${key}-${item.split("").reverse().join("")}`);
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

                expect(() => data.mapToDictionary((item) => {
                    return [item.name];
                })).toThrowError();

                expect(() => data.mapToDictionary((item) => {
                    return [item.name, item.id, 'error'];
                })).toThrowError();
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

                const data2 = collect({1: 'a', 2: 'b', 3: 'a'});

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
                    ])
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
                const c = collect({name: 'hello'});
                expect(c.merge(null).all()).toEqual({name: 'hello'});
            });

            it("test merge array", () => {
                const c = collect({ name: "Hello" });
                expect(c.merge({ id: 1 }).all()).toEqual({ name: "Hello", id: 1 });

                const d = collect(["hello"]);
                expect(d.merge(1).all()).toEqual(["hello", 1]);
            });

            it("test merge collection", () => {
                const c = collect({name: 'Hello'});
                expect(c.merge(collect({name: 'World', id: 1})).all()).toEqual({name: 'World', id: 1});

                const d = collect(['hello']);
                expect(d.merge(collect(['world'])).all()).toEqual(['hello', 'world']);
            });            
        });

        it("merge object items with array", () => {
            const c = collect({a: 1, b: 2});
            expect(c.merge([3, 4]).all()).toEqual({ '0': 3, '1': 4, a: 1, b: 2 });
        })
    });
    
    describe("mergeRecursive", () => {
        describe("Laravel Tests", () => {
            it("test merge recursive null", () => {
                const c = collect({name: 'hello'});
                expect(c.mergeRecursive(null).all()).toEqual({name: 'hello'});
            });

            it("test merge recursive array", () => {
                const c = collect({ name: "Hello", id: 1 });
                expect(c.mergeRecursive({ id: 2 }).all()).toEqual({ name: "Hello", id: [1, 2] });

                const d = collect({ name: "Hello", tags: ["a"] });
                expect(d.mergeRecursive({ tags: ["b", "c"] }).all()).toEqual({
                    name: "Hello",
                    tags: ["a", "b", "c"],
                });
            });

            it("test merge recursive collection", () => {
                const c = collect({ name: "Hello", id: 1, meta: { tags: ["a", "b"], roles: "admin" } });
                const merged = c.mergeRecursive(collect({ meta: { tags: ["c"], roles: "editor" } }));
                expect(merged.all()).toEqual({
                    name: "Hello",
                    id: 1,
                    meta: { tags: ["a", "b", "c"], roles: ["admin", "editor"] },
                });
            });
        });

        it("test target is array and source is not", () => {
            const target = collect({a: [1, 2, 3]});
            const source = collect({ a: 4});
            expect(target.mergeRecursive(source).all()).toEqual({ a: [1, 2, 3, 4] });
        });

        it("test source is array and target is not", () => {
            const target = collect({a: 7});
            const source = collect({a: [1, 2, 3]});
            expect(target.mergeRecursive(source).all()).toEqual({ a: [7, 1, 2, 3] });
        });

        it("test merging existing keys and adding new keys", () => {
            const target = collect({a: 5, b: [3, 4], c: {z: 5, y: [9,0]}});
            const source = collect({a: 6, b: [5, 6], c: {z: 6, y: [10,11]}, d: 'new'});
            expect(target.mergeRecursive(source).all()).toEqual({
                a: [5, 6],
                b: [3, 4, 5, 6],
                c: {z: [5, 6], y: [9,0,10,11]},
                d: 'new'
            });
        });

        it("test merging arrays", () => {
            const target = collect([1, [4, 5, 7], {b: 4, c: 5, d: [8,9], e: {x: 1, y: 2}}]);
            const source = collect([2, [6, 8], {b: 5, c: 6, d: [10,11], e: {x: 3, z: 4}}, 3]);
            expect(target.mergeRecursive(source).all()).toEqual([
                [1, 2],
                [4, 5, 7, 6, 8],
                {b: [4, 5], c: [5, 6], d: [8, 9, 10, 11], e: {x: [1, 3], y: 2, z: 4}},
                3
            ]);
        })

        it("test merging arrays when target array is longer than source", () => {
            const target = collect([1, [2, 3, 4], {a: 7, b: 8, c: 9}]);
            const source = collect([5, [6]]);
            expect(target.mergeRecursive(source).all()).toEqual([
                [1, 5],
                [2, 3, 4, 6],
                {a: 7, b: 8, c: 9}
            ]);
        });

        it("test merging object and arrays", () => {
            const target = collect({a: 1, b: [2, 3], c: {x: 4, y: 5}});
            const source = collect({a: [6, 7], b: 4, c: {x: [8, 9]}});
            expect(target.mergeRecursive(source).all()).toEqual({
                a: [1, 6, 7],
                b: [2, 3, 4],
                c: {x: [4, 8, 9], y: 5},
            });

            const target2 = collect({a: 1, b: {x: 2, y: 3}, c: [4, 5]});
            const source2 = collect([[6, 7], 4, {x: [8, 9]}]);
            expect(target2.mergeRecursive(source2).all()).toEqual({
                "0": [6, 7],
                "1": 4,
                "2": {x: [8, 9]},
                a: 1,
                b: {x: 2, y: 3},
                c: [4, 5],
            });
        })
    });
    
    describe("multiply", () => {
        it("Laravel Tests", () => {
            const c = collect(['Hello', 1, { tags: ['a', 'b'], role: 'admin' }]);

            expect(c.multiply(-1).all()).toEqual([]);
            expect(c.multiply(0).all()).toEqual([]);

            expect(c.multiply(1).all()).toEqual(['Hello', 1, { tags: ['a', 'b'], role: 'admin' }]);

            expect(c.multiply(3).all()).toEqual([
                'Hello', 1, { tags: ['a', 'b'], role: 'admin' },
                'Hello', 1, { tags: ['a', 'b'], role: 'admin' },
                'Hello', 1, { tags: ['a', 'b'], role: 'admin' }
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

                const d = collect(['name', 'family']);
                expect(d.combine(['taylor', 'otwell']).all()).toEqual([
                    ['name', 'taylor'],
                    ['family', 'otwell'],
                ]);

                const e = collect({1: 'name', 2: 'family'});
                expect(e.combine({2: 'taylor', 3: 'otwell'}).all()).toEqual({
                    name: 'taylor',
                    family: 'otwell',
                });

                const f = collect({1: 'name', 2: 'family'});
                expect(f.combine({2: 'taylor', 3: 'otwell'}).all()).toEqual({
                    name: 'taylor',
                    family: 'otwell',
                });
            });

            it("test combine with collection", () => {
                const c = collect([1, 2, 3]);
                expect(c.combine(collect([4, 5, 6])).all()).toEqual([
                    [1, 4],
                    [2, 5],
                    [3, 6],
                ]);

                const f = collect({1: 'name', 2: 'family'});
                expect(f.combine(collect({2: 'taylor', 3: 'otwell'})).all()).toEqual({
                    name: 'taylor',
                    family: 'otwell',
                });
            });
        });
    });
    
    describe("", () => {
        describe("Laravel Tests", () => {
            it("", () => {});
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
});
