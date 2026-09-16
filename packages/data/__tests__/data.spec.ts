import * as Arr from "@tolki/arr";
import * as Data from "@tolki/data";
import * as Obj from "@tolki/obj";
import {
    ItemNotFoundException,
    MultipleItemsFoundException,
} from "@tolki/utils";
import { afterEach, assertType, describe, expect, it } from "vitest";

const strcasecmp = (a: unknown, b: unknown) =>
    String(a).toLowerCase() === String(b).toLowerCase();

/**
 * Wrap items in the smallest Collection-like operand, which obj unwraps through `all()`.
 *
 * @param items - The items `all()` returns
 * @returns An object whose `all()` returns the items
 */
const collectionLike = <T>(items: T) => ({ all: () => items });

/**
 * Build `["a", <hole>, "c"]`: a three-element list whose middle index is absent.
 *
 * Written by index because oxlint's `no-sparse-arrays` rejects the elision literal.
 *
 * @returns A list of length 3 with no own key at index 1
 */
const sparseList = (): string[] => {
    const list: string[] = [];
    list[0] = "a";
    list[2] = "c";

    return list;
};

/**
 * Build `["a", <hole>, <hole>]`: a three-element list whose last two indices are absent.
 *
 * A TRAILING hole declares no own key at all, so a helper that rebuilds from
 * `Object.keys` shortens it, where an interior hole is still bracketed by one.
 *
 * @returns A list of length 3 with own keys at index 0 only
 */
const trailingHoleList = (): string[] => {
    const list: string[] = [];
    list[0] = "a";
    list.length = 3;

    return list;
};

/**
 * A class instance with own fields, which PHP's array helpers keep whole instead of walking.
 */
class Point {
    x = 1;
    y = 2;
}

/** The single-field instance the write-path probes use, so a citation names the same call. */
class D4Point {
    x = 1;
}

describe("Data", () => {
    describe("dataAdd", () => {
        it("is object", () => {
            const result = Data.dataAdd({ a: 1 }, "b", 2);
            expect(result).toEqual({ a: 1, b: 2 });

            assertType<{ a: number; b: number }>(result);
        });

        it("is array", () => {
            const result = Data.dataAdd([1, 2], 2, 3);
            expect(result).toEqual([1, 2, 3]);

            assertType<number[]>(result);

            const result2 = Data.dataAdd([1, "b"], 2, 3);
            expect(result2).toEqual([1, "b", 3]);

            assertType<(number | string)[]>(result2);
        });

        it("leaves the caller's own list alone", () => {
            // JS-only: arr.add copies the top level only, so the list handed in is untouched.
            const source = [1, 2, 3];

            expect(Data.dataAdd(source, 3, 4)).toEqual([1, 2, 3, 4]);
            expect(source).toEqual([1, 2, 3]);
        });

        it("leaves the caller's nested value alone for a list backing", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "add-nested-list-leaves-the-caller-value-untouched"
            const inner = ["desk"];
            const source = ["products", inner];

            expect(Data.dataAdd(source, "1.1", 200)).toEqual([
                "products",
                ["desk", 200],
            ]);
            expect(inner).toEqual(["desk"]);
        });

        it("leaves the caller's nested value alone for a record backing", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "add-nested-record-leaves-the-caller-value-untouched": the record half of
            // the case above, which now answers the same way.
            const inner = { z: 1 };

            expect(Data.dataAdd({ a: inner }, "a.y", 2)).toEqual({
                a: { z: 1, y: 2 },
            });
            expect(inner).toEqual({ z: 1 });
        });

        it("replaces a nested class instance on both backings", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "add-nested-object-is-
            // replaced-wholesale" ([new D4Point(1)], '0.y', 2 -> [{"y": 2}]) and
            // "add-assoc-nested-object-is-replaced-wholesale" (the keyed twin).
            const listItem = new D4Point();
            const recordItem = new D4Point();

            expect(Data.dataAdd([listItem], "0.y", 2)).toEqual([{ y: 2 }]);
            expect(Data.dataAdd({ a: recordItem }, "a.y", 2)).toEqual({
                a: { y: 2 },
            });
            expect(Object.entries(listItem)).toEqual([["x", 1]]);
            expect(Object.entries(recordItem)).toEqual([["x", 1]]);
        });

        it("descends into a nested list on both backings", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "d6-nested-list-in-a-list-is-descended" ([['q']], '0.1') and
            // "d6-nested-list-is-descended-not-replaced" (['a' => ['q']], 'a.1').
            const listInner = ["q"];
            const recordInner = ["q"];

            expect(Data.dataAdd([listInner], "0.1", "y")).toEqual([["q", "y"]]);
            expect(Data.dataAdd({ a: recordInner }, "a.1", "y")).toEqual({
                a: ["q", "y"],
            });
            expect(listInner).toEqual(["q"]);
            expect(recordInner).toEqual(["q"]);
        });

        it("materializes a Set backing and answers from arr.add", () => {
            // JS-only: PHP has no Set, and Arr::add takes an array, so no PHP call records
            // this. The type follows obj here; only the runtime follows arr.
            expect(Data.dataAdd(new Set([7, 8]), 0, 9)).toEqual([7, 8]);
            expect(Data.dataAdd(new Set([7, 8]), 2, 9)).toEqual([7, 8, 9]);
            expect(Obj.add(new Set([7, 8]), 0, 9)).toEqual({ 0: 9 });
        });

        it("wraps a scalar, string or nullish backing as a list", () => {
            // JS-only: Arr::add takes an array, so no PHP call records a scalar backing.
            expect(Data.dataAdd(5, 1, 9)).toEqual([5, 9]);
            expect(Data.dataAdd("ab", 1, 9)).toEqual(["ab", 9]);
            expect(Data.dataAdd(null, 0, 9)).toEqual([9]);

            // Compared by element identity: an undefined element is not a missing one.
            const wrapped = Data.dataAdd(undefined, 1, 9);
            expect(wrapped).toHaveLength(2);
            expect(wrapped[0]).toBeUndefined();
            expect(wrapped[1]).toBe(9);
        });
    });

    describe("dataItem", () => {
        it("is object", () => {
            const result = Data.dataItem({ a: { f: 3 }, b: { g: 4 } }, "b");
            expect(result).toEqual({ g: 4 });
            assertType<{ g: number }>(result);

            const result2 = Data.dataItem({ a: { f: 3 }, b: { g: 4 } }, "c", {
                t: 4,
            });
            expect(result2).toEqual({ t: 4 });
            assertType<{ t: number }>(result2);

            const result3 = Data.dataItem(
                { a: { f: 3 }, b: { g: 4 } },
                "c",
                () => ({ x: 5 }),
            );
            expect(result3).toEqual({ x: 5 });
            assertType<{ x: number }>(result3);

            expect(
                Data.dataItem({ a: { f: 3 }, b: { g: 4 } }, "x", {
                    error: "not found",
                }),
            ).toEqual({ error: "not found" });
        });

        it("is array", () => {
            const result = Data.dataItem(
                [
                    [1, 2],
                    [2, 3],
                ],
                1,
            );
            expect(result).toEqual([2, 3]);

            assertType<number[]>(result);

            // Use as const with explicit tuple type
            const tupleData = [
                [2, 3],
                ["a", "b"],
            ] as const;
            const result2 = Data.dataItem(tupleData, 1);
            expect(result2).toEqual(["a", "b"]);
            // TypeScript infers: readonly [2, 3] | readonly ["a", "b"]
            // We need to assert the specific type we expect
            assertType<readonly [2, 3] | readonly ["a", "b"]>(result2);

            // Explicit tuple type annotation
            const explicitTuple: [
                readonly [number, number],
                readonly [string, string],
            ] = [
                [2, 3],
                ["a", "b"],
            ];
            const result3 = Data.dataItem(explicitTuple, 1);
            expect(result3).toEqual(["a", "b"]);
            assertType<readonly [string, string] | readonly [number, number]>(
                result3,
            );

            expect(
                Data.dataItem(
                    [
                        [1, 2],
                        [2, 3],
                    ],
                    3,
                    ["not found"],
                ),
            ).toEqual(["not found"]);
        });

        it("names the found type the way PHP's gettype does, through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "array-int-value"
            expect(() => Data.dataItem({ a: 5 }, "a")).toThrow(
                "Object value for key [a] must be an object, integer found.",
            );
        });
    });

    describe("dataBoolean", () => {
        it("is object", () => {
            expect(Data.dataBoolean({ active: true }, "active", false)).toBe(
                true,
            );
            expect(Data.dataBoolean({ active: false }, "missing", true)).toBe(
                true,
            );
            expect(Data.dataBoolean({ active: true }, "active")).toBe(true);
        });

        it("is array", () => {
            expect(Data.dataBoolean([true, false], 0, false)).toBe(true);
            expect(Data.dataBoolean([true, false], 0)).toBe(true);
        });

        it("throws when the value is not a boolean, naming the backing in the message", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "boolean-string-value", "boolean-list-int-key"
            // JS-only: @tolki/obj reports "Object value for key [...]" because it is the
            // object-shaped port of the same helper; PHP has only the array prefix.
            expect(() =>
                Data.dataBoolean({ string: "foo bar" }, "string"),
            ).toThrow(
                "Object value for key [string] must be a boolean, string found.",
            );
            expect(() => Data.dataBoolean(["foo bar"], 0)).toThrow(
                "Array value for key [0] must be a boolean, string found.",
            );
        });

        it("returns the default for a missing key instead of throwing", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "boolean-missing-key-default"
            expect(Data.dataBoolean({}, "missing", true)).toBe(true);
            expect(Data.dataBoolean([], 0, false)).toBe(false);
        });

        it("throws for a missing key when no default is given", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "boolean-missing-key-no-default", "boolean-list-missing-index-no-default"
            // JS-only: the object backing says "Object value for key [...]"; PHP has only the array prefix.
            expect(() =>
                Data.dataBoolean({ active: false }, "missing"),
            ).toThrow(
                "Object value for key [missing] must be a boolean, NULL found.",
            );
            expect(() => Data.dataBoolean([true, false], 5)).toThrow(
                "Array value for key [5] must be a boolean, NULL found.",
            );
        });
    });

    describe("dataChunk", () => {
        it("is object", () => {
            const result = Data.dataChunk({ a: 1, b: 2, c: 3, d: 4, e: 5 }, 2);
            expect(result).toEqual({
                0: { a: 1, b: 2 },
                1: { c: 3, d: 4 },
                2: { e: 5 },
            });

            assertType<
                Record<
                    number,
                    | Partial<{
                          a: number;
                          b: number;
                          c: number;
                          d: number;
                          e: number;
                      }>
                    | Record<number, number>
                >
            >(result);

            const result1 = Data.dataChunk(
                { a: 1, b: 2, c: 3, d: 4, e: 5 },
                2,
                true,
            );
            expect(result1).toEqual({
                0: { a: 1, b: 2 },
                1: { c: 3, d: 4 },
                2: { e: 5 },
            });

            const result2 = Data.dataChunk(
                { a: 1, b: 2, c: 3, d: 4, e: 5 },
                2,
                false,
            );
            expect(result2).toEqual({
                0: { 0: 1, 1: 2 },
                1: { 0: 3, 1: 4 },
                2: { 0: 5 },
            });
        });

        it("is array", () => {
            const result = Data.dataChunk([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3);
            expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);

            assertType<number[][] | Record<number, number>[]>(result);

            const result2 = Data.dataChunk(
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                3,
                false,
            );
            expect(result2).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);

            assertType<number[][] | Record<number, number>[]>(result2);
        });

        it("honours preserveKeys on an array backing", () => {
            // CollectionTest::testChunk — a preserved-key chunk keeps the source offsets.
            expect(Data.dataChunk([1, 2, 3, 4], 2, true)).toEqual([
                { 0: 1, 1: 2 },
                { 2: 3, 3: 4 },
            ]);
        });

        it("returns nothing for a zero or negative size", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "collection-chunk-zero", "collection-chunk-negative", "arr-chunk-zero-and-negative"
            expect(Data.dataChunk([1, 2, 3], 0)).toEqual([]);
            expect(Data.dataChunk([1, 2, 3], -1)).toEqual([]);
            expect(Data.dataChunk({ a: 1, b: 2 }, 0)).toEqual({});
            expect(Data.dataChunk({ a: 1, b: 2 }, -1)).toEqual({});
        });

        it("leaves the remainder in a short final chunk", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "collection-chunk-last-chunk-keys"
            expect(
                Data.dataChunk([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3)[3],
            ).toEqual([10]);
        });
    });

    describe("dataChunkWhile", () => {
        it("is object", () => {
            const result = Data.dataChunkWhile(
                { a: 1, b: 1, c: 2, d: 2, e: 3 },
                (value, _key, chunk) => Object.values(chunk).at(-1) === value,
            );

            expect(result).toEqual({
                0: { a: 1, b: 1 },
                1: { c: 2, d: 2 },
                2: { e: 3 },
            });
            expect(result).toEqual(
                Obj.chunkWhile(
                    { a: 1, b: 1, c: 2, d: 2, e: 3 },
                    (value, _key, chunk) =>
                        Object.values(chunk).at(-1) === value,
                ),
            );
            // A chunk holds a subset of the keys, which is what objChunkWhile now declares.
            assertType<
                Record<
                    number,
                    Partial<Record<"a" | "b" | "c" | "d" | "e", number>>
                >
            >(result);
        });

        it("is array", () => {
            const result = Data.dataChunkWhile(
                ["A", "A", "B", "B", "C"],
                (value, _index, chunk) => chunk.at(-1) === value,
            );

            expect(result).toEqual([["A", "A"], ["B", "B"], ["C"]]);
            expect(result).toEqual(
                Arr.chunkWhile(
                    ["A", "A", "B", "B", "C"],
                    (value, _index, chunk) => chunk.at(-1) === value,
                ),
            );
            assertType<string[][]>(result);
        });

        it("is empty", () => {
            expect(Data.dataChunkWhile([], () => true)).toEqual([]);
            expect(Data.dataChunkWhile({}, () => true)).toEqual({});
        });
    });

    describe("dataChunkBy", () => {
        it("is object", () => {
            const result = Data.dataChunkBy(
                { a: 1, b: 1, c: 2, d: 2, e: 1 },
                (value) => value,
            );

            expect(result).toEqual({
                0: { a: 1, b: 1 },
                1: { c: 2, d: 2 },
                2: { e: 1 },
            });
            expect(result).toEqual(
                Obj.chunkBy({ a: 1, b: 1, c: 2, d: 2, e: 1 }, (value) => value),
            );
            expect(
                Data.dataChunkBy(
                    {
                        p: { address: { city: "NY" } },
                        q: { address: { city: "LA" } },
                    },
                    "address.city",
                ),
            ).toEqual({
                0: { p: { address: { city: "NY" } } },
                1: { q: { address: { city: "LA" } } },
            });
            expect(
                Data.dataChunkBy(
                    {
                        p: { parent: "a" },
                        q: { parent: "a" },
                        r: { parent: "b" },
                    },
                    "parent",
                ),
            ).toEqual({
                0: { p: { parent: "a" }, q: { parent: "a" } },
                1: { r: { parent: "b" } },
            });
        });

        it("is array", () => {
            const products = [
                { parent: "a", name: "1" },
                { parent: "a", name: "2" },
                { parent: "b", name: "3" },
            ];
            const result = Data.dataChunkBy(products, "parent");

            expect(result).toEqual([[products[0], products[1]], [products[2]]]);
            expect(result).toEqual(Arr.chunkBy(products, "parent"));
            expect(
                Data.dataChunkBy([1, 1, 2, 2, 3, 3, 3], (value) => value),
            ).toEqual([
                [1, 1],
                [2, 2],
                [3, 3, 3],
            ]);
            assertType<{ parent: string; name: string }[][]>(result);
        });

        it("is empty", () => {
            expect(Data.dataChunkBy([], "key")).toEqual([]);
            expect(Data.dataChunkBy({}, "key")).toEqual({});
        });
    });

    describe("dataCollapse", () => {
        it("skips a Date item through the list backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-skips-objects"
            expect(Data.dataCollapse([[1], new Date(0), [2]])).toEqual([1, 2]);
        });
        it("skips a class instance item through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-skips-objects"
            class Point {
                x = 1;
                y = 2;
            }

            expect(
                Data.dataCollapse({ g1: { a: 1 }, g2: new Point() }),
            ).toEqual({ a: 1 });
        });
        it("is object", () => {
            const obj = { a: { x: 1 }, b: { y: 2 }, c: { z: 3 } };
            expect(Data.dataCollapse(obj)).toEqual({ x: 1, y: 2, z: 3 });

            expect(Data.dataCollapse({ a: { x: 1 }, b: { y: 2 } })).toEqual({
                x: 1,
                y: 2,
            });
        });

        it("is array", () => {
            const data = [["foo", "bar"], ["baz"]];
            expect(Data.dataCollapse(data)).toEqual(["foo", "bar", "baz"]);

            expect(
                Data.dataCollapse([
                    [1, 2],
                    [3, 4],
                ]),
            ).toEqual([1, 2, 3, 4]);
        });

        it("collapses list values, appending their elements, through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-assoc-of-lists"
            expect(Data.dataCollapse({ a: [1, 2], b: [3] })).toEqual({
                0: 1,
                1: 2,
                2: 3,
            });
        });

        it("keeps list items beside an object item and unwraps Collection-like items on a list", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-list-then-map", "collapse-collection-items"
            expect(Data.dataCollapse([[1, 2], { x: 1, 0: "z" }])).toEqual({
                0: 1,
                1: 2,
                2: "z",
                x: 1,
            });
            expect(
                Data.dataCollapse([
                    collectionLike([1, 2]),
                    5,
                    collectionLike([3]),
                ]),
            ).toEqual([1, 2, 3]);
        });

        it("merges a Collection-like item's items through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-assoc-collection-item"
            expect(
                Data.dataCollapse({ a: collectionLike({ x: 1 }), b: { y: 2 } }),
            ).toEqual({ x: 1, y: 2 });
        });

        it("renumbers a negative integer key through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-negative-int-keys"
            expect(
                Data.dataCollapse({
                    g1: { "-1": "a", k: "b" },
                    g2: { "-1": "c" },
                }),
            ).toEqual({ 0: "a", 1: "c", k: "b" });
        });
    });

    describe("dataCombine", () => {
        it("is object", () => {
            // Four keys, four values; obj.spec.ts's combine tests cover a function key.
            // JS-only: PHP has no undefined; toPhpKeyString keys it "" as array_combine keys null.
            const keys = {
                1: "name",
                2: "family",
                3: "role",
                4: undefined,
            };
            const values = { 0: "John", 1: "Doe", 2: "admin", 3: "N/A" };
            const result = Data.dataCombine(keys, values);

            expect(result).toEqual({
                name: "John",
                family: "Doe",
                role: "admin",
                "": "N/A",
            });
        });

        // `Arr.combine` used to zip arrays into tuples (`[[1,4],[2,5],[3,6]]`),
        // diverging in *shape* from the object branch above, which already produced a
        // keyed map — a unison-rule violation this test was pinning.
        it("is array", () => {
            const baseData = [1, 2, 3];
            const result = Data.dataCombine(baseData, [4, 5, 6]);

            expect(result).toEqual({ 1: 4, 2: 5, 3: 6 });
        });

        it("combines a list with a keyed operand, and an object with a list operand", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "combine-list-keyed-values", "D5 combine null/bool/float keys"
            expect(Data.dataCombine([1, 2], { a: "x", b: "y" })).toEqual({
                1: "x",
                2: "y",
            });
            expect(Data.dataCombine({ k: null }, [1])).toEqual({ "": 1 });
        });

        // PHP raises a ValueError on a key/value count mismatch; PHP-verified message
        // (docs/php-parity/task-04-shared.json, "array_combine mismatch"). Asserted for
        // both shapes, per the unison rule.
        it("throws when the key and value counts differ — both shapes agree", () => {
            expect(() => Data.dataCombine(["a", "b"], [1])).toThrow(
                "array_combine(): Argument #1 ($keys) and argument #2 ($values) must have the same number of elements",
            );
            expect(() =>
                Data.dataCombine({ x: "a", y: "b" }, { p: 1 }),
            ).toThrow(
                "array_combine(): Argument #1 ($keys) and argument #2 ($values) must have the same number of elements",
            );
        });

        it("casts null, true and false keys the way array_combine does", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "D5 combine null/bool/float keys"
            expect(Data.dataCombine({ k: null }, [1])).toEqual({ "": 1 });
            expect(Data.dataCombine({ k: true }, [1])).toEqual({ 1: 1 });
            expect(Data.dataCombine({ k: false }, [1])).toEqual({ "": 1 });
        });

        it("keys a float by PHP's (string) cast, through both backings", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "combine-float-keys"
            expect(
                Object.keys(
                    Data.dataCombine({ a: NaN, b: 1 / 3 }, { a: 1, b: 2 }),
                ),
            ).toEqual(["NAN", "0.33333333333333"]);
            expect(
                Object.keys(Data.dataCombine([1.5e300, 5e-324], [1, 2])),
            ).toEqual(["1.5E+300", "4.9406564584125E-324"]);
        });

        it("reads an object backing's own values as the keys, without calling its all()", () => {
            // JS-only: Collection::combine keys by $this->all(), an array with no methods; JS objects inherit them.
            class Repo {
                name = "repo";

                all() {
                    return ["CALLED"];
                }
            }

            expect(Data.dataCombine(new Repo() as never, [1])).toEqual({
                repo: 1,
            });
        });

        it("wraps a scalar, string or nullish keys backing rather than reading it empty", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "d7-combine-scalar-backing"
            // PHP's empty array is this package's empty record, as combine always keys.
            expect(Data.dataCombine(5, ["x"])).toEqual({ 5: "x" });
            expect(Data.dataCombine("k", ["x"])).toEqual({ k: "x" });
            expect(Data.dataCombine(null, [])).toEqual({});
            // The keyed mirror of the same one-key backing.
            expect(Data.dataCombine({ 0: 5 }, ["x"])).toEqual({ 5: "x" });
        });

        it("materializes a Traversable keys backing rather than reading it empty", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "d7-combine-traversable-backing"
            expect(Data.dataCombine(new Set(["k1", "k2"]), ["x", "y"])).toEqual(
                { k1: "x", k2: "y" },
            );
            // The keyed mirror of the same backing, which needs no materializing.
            expect(Data.dataCombine({ 0: "k1", 1: "k2" }, ["x", "y"])).toEqual({
                k1: "x",
                k2: "y",
            });
        });

        it("normalizes a Map keys backing the way dispatch would", () => {
            // JS-only: PHP has no Map. `toKeyedData` builds the record it mirrors, and the
            // two must answer alike — the body used to read a Map as an empty key set and throw.
            const asMap = new Map([
                ["a", "k1"],
                ["b", "k2"],
            ]);
            expect(Data.dataCombine(asMap, ["x", "y"])).toEqual({
                k1: "x",
                k2: "y",
            });
            expect(Data.dataCombine(asMap, ["x", "y"])).toEqual(
                Data.dataCombine({ a: "k1", b: "k2" }, ["x", "y"]),
            );
        });
    });

    describe("dataCount", () => {
        it("is object", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            expect(Data.dataCount(obj)).toBe(4);
        });

        it("is array", () => {
            const arr = [1, 2, 3, 4, 5];
            expect(Data.dataCount(arr)).toBe(5);
        });

        it("counts an empty backing as zero", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "count-empty"
            expect(Data.dataCount({})).toBe(0);
            expect(Data.dataCount([])).toBe(0);
        });

        it("counts only the top level, never descending into nested containers", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "count-nested-top-level-only"
            // The object nests two leaves under "a" so a recursive-leaf-count bug (which
            // would see 3: b, c, d) is distinguishable from the correct top-level count (2).
            expect(Data.dataCount({ a: { b: 1, c: 2 }, d: 3 })).toBe(2);
            expect(Data.dataCount([[1, 2], [3]])).toBe(2);
        });
    });

    describe("dataCrossJoin", () => {
        it("is object", () => {
            const result = Data.dataCrossJoin({ a: [1] }, { b: ["x"] });
            expect(result).toEqual([{ a: 1, b: "x" }]);
        });

        it("is array", () => {
            const result = Data.dataCrossJoin([1, 2], ["a", "b"]);
            expect(result).toEqual([
                [1, "a"],
                [1, "b"],
                [2, "a"],
                [2, "b"],
            ]);
        });

        it("multiplies every key of one argument, through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "crossJoin-string-spread", "crossJoin-string-spread-3"
            expect(
                Data.dataCrossJoin({
                    size: ["S", "M"],
                    color: ["red", "blue"],
                }),
            ).toEqual([
                { size: "S", color: "red" },
                { size: "S", color: "blue" },
                { size: "M", color: "red" },
                { size: "M", color: "blue" },
            ]);

            // A third key ("c") multiplies every prior row again.
            expect(
                Data.dataCrossJoin({
                    a: [1, 2],
                    b: ["x"],
                    c: ["I", "II"],
                }),
            ).toEqual([
                { a: 1, b: "x", c: "I" },
                { a: 1, b: "x", c: "II" },
                { a: 2, b: "x", c: "I" },
                { a: 2, b: "x", c: "II" },
            ]);
        });

        it("walks a plain-object argument's values, through the list backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "crossJoin-list-map-dimension"
            expect(Data.dataCrossJoin([1, 2], { a: "x", b: "y" })).toEqual([
                [1, "x"],
                [1, "y"],
                [2, "x"],
                [2, "y"],
            ]);
        });

        it("walks a plain-object dimension's values, through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "crossJoin-string-spread-map-dimension"
            expect(
                Data.dataCrossJoin({ a: [1, 2], b: { k: "x", j: "y" } }),
            ).toEqual([
                { a: 1, b: "x" },
                { a: 1, b: "y" },
                { a: 2, b: "x" },
                { a: 2, b: "y" },
            ]);
        });
    });

    describe("dataDivide", () => {
        it("is object", () => {
            expect(Data.dataDivide({ a: 1, b: 2 })).toEqual([
                ["a", "b"],
                [1, 2],
            ]);
        });

        it("is array", () => {
            expect(Data.dataDivide([1, 2, 3])).toEqual([
                [0, 1, 2],
                [1, 2, 3],
            ]);
        });

        it("divides an empty backing into two empty lists", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "divide-empty"
            expect(Data.dataDivide({})).toEqual([[], []]);
            expect(Data.dataDivide([])).toEqual([[], []]);
        });

        it("types a numeric key as a number and keeps array values whole", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "divide-int-key-types"
            // docs/php-parity/task-24-data-release-readiness.json, "divide-array-values"
            expect(Data.dataDivide({ a: [1, 2], b: "x" })).toEqual([
                ["a", "b"],
                [[1, 2], "x"],
            ]);
            // JS-only: PHP's ['' => 'Null', 1 => 'one'] divides to [["",1],["Null","one"]];
            // a JS object hoists integer-like keys ahead of string keys, so the pair order
            // is [[1,""],["one","Null"]] for the same input. The key *types* still match.
            expect(Data.dataDivide({ "": "Null", 1: "one" })).toEqual([
                [1, ""],
                ["one", "Null"],
            ]);
        });
    });

    describe("dataDot", () => {
        it("is object", () => {
            const result = Data.dataDot({ a: { b: 1, c: 2 } });
            expect(result).toEqual({
                "a.b": 1,
                "a.c": 2,
            });
        });

        it("is array", () => {
            const result = Data.dataDot(["a", ["b", ["c"]]]);
            expect(result).toEqual({
                "0": "a",
                "1.0": "b",
                "1.1.0": "c",
            });
        });

        it("dot with depth on object", () => {
            const result = Data.dataDot(
                { user: { name: "Taylor", address: { city: "Dallas" } } },
                "",
                1,
            );
            expect(result).toEqual({
                "user.name": "Taylor",
                "user.address": { city: "Dallas" },
            });
        });

        it("dot with depth on array", () => {
            const result = Data.dataDot([1, [2, [3, [4]]]], "", 1);
            expect(result).toEqual({
                "0": 1,
                "1.0": 2,
                "1.1": [3, [4]],
            });
        });

        it("concatenates the prepend string without adding a dot", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "dot-prepend-no-dot"
            expect(Data.dataDot({ name: "John" }, "user")).toEqual({
                username: "John",
            });
        });

        it("keeps a class instance as a leaf, through both backings", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "dot-object-leaf"
            const point = new Point();
            const list = Data.dataDot([point]);
            const map = Data.dataDot({ p: point });
            expect(Object.keys(list)).toEqual(["0"]);
            expect(list["0"]).toBe(point);
            expect(Object.keys(map)).toEqual(["p"]);
            expect(map["p"]).toBe(point);
        });
    });

    describe("dataUndot", () => {
        it("is object", () => {
            const result = Data.dataUndot({
                name: "John",
                "address.city": "NYC",
                "address.zip": "10001",
            });
            expect(result).toEqual({
                name: "John",
                address: {
                    city: "NYC",
                    zip: "10001",
                },
            });
        });

        it("is array", () => {
            const result = Data.dataUndot(
                { "0": "a", "1.0": "b", "1.1.0": "c" },
                true,
            );
            expect(result).toEqual(["a", ["b", ["c"]]]);
        });

        it("rebuilds a list from consecutive integer segments starting at 0, through the object backing", () => {
            // PHP-verified: docs/php-parity/task-09-paths.json, "Arr::undot
            // — integer segments rebuild a list".
            const result = Data.dataUndot({
                "user.languages.0": "PHP",
                "user.languages.1": "C#",
                "user.name": "Taylor",
            });
            expect(result).toEqual({
                user: { languages: ["PHP", "C#"], name: "Taylor" },
            });
        });

        it("normalizes a Map backing the way dispatch would", () => {
            // JS-only: PHP has no Map. `toKeyedData` builds the record it mirrors, and the
            // two must answer alike — obj.undot walks with Object.entries, which reads a
            // Map as empty, so the backing has to become a record first.
            const dotted = new Map([
                ["address.city", "NYC"],
                ["address.zip", "10001"],
            ]);
            expect(Data.dataUndot(dotted)).toEqual({
                address: { city: "NYC", zip: "10001" },
            });
            expect(Data.dataUndot(dotted)).toEqual(
                Data.dataUndot({
                    "address.city": "NYC",
                    "address.zip": "10001",
                }),
            );
        });

        it("wraps a scalar, string or Traversable backing rather than reading it empty", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "r4-undot-backings"
            function* dotted(): Generator<string> {
                yield "a.b";
            }

            expect(Data.dataUndot(5)).toEqual([5]);
            expect(Data.dataUndot("a.b")).toEqual(["a.b"]);
            expect(Data.dataUndot(true)).toEqual([true]);
            expect(Data.dataUndot(new Set(["a.b"]))).toEqual(["a.b"]);
            expect(Data.dataUndot(dotted())).toEqual(["a.b"]);
            expect(Data.dataUndot(null)).toEqual([]);
            expect(Data.dataUndot([1, 2, 3])).toEqual([1, 2, 3]);
            // The keyed mirror of the same one-element backing.
            expect(Data.dataUndot({ 0: 5 })).toEqual({ 0: 5 });
        });
    });

    describe("dataUnion", () => {
        it("is object", () => {
            const result = Data.dataUnion({ a: 1 }, { b: 2 });
            expect(result).toEqual({ a: 1, b: 2 });
        });

        it("is array", () => {
            // PHP-verified directly (`+` is a native operator, ): [1,2] + [2,3] ->
            // [1,2] — both indices the right side could fill are already occupied by
            // the left, so it contributes nothing.
            const result = Data.dataUnion([1, 2], [2, 3]);
            expect(result).toEqual([1, 2]);
        });

        it("extends the tail once the left operand runs out of indices", () => {
            // PHP-verified: [1,2] + [3,4,5] -> [1,2,5].
            const result = Data.dataUnion([1, 2], [3, 4, 5]);
            expect(result).toEqual([1, 2, 5]);
        });

        it("unions an object with a list operand, and a list with a keyed operand", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "union-list-operand", "list-backing-keyed-operand"
            expect(Data.dataUnion({ a: 1 }, [5])).toEqual({ a: 1, 0: 5 });
            expect(Data.dataUnion(["a", "b"], { 2: "z" })).toEqual([
                "a",
                "b",
                "z",
            ]);
        });

        it("returns the keyed result when a keyed operand leaves a list backing's keys other than 0..n-1", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "union-list-backing-keyed-result"
            expect(Data.dataUnion([], { a: 1 })).toEqual({ a: 1 });
            expect(Data.dataUnion([1, 2], { a: 1, 5: 9 })).toEqual({
                0: 1,
                1: 2,
                a: 1,
                5: 9,
            });
            expect(Data.dataUnion([1, 2], { "-1": 9 })).toEqual({
                0: 1,
                1: 2,
                "-1": 9,
            });
            expect(Data.dataUnion([1], { 3: 4 })).toEqual({ 0: 1, 3: 4 });
        });

        it("stays keyed once an operand leaves a gap, even when a later one fills it", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "union-list-backing-keyed-result"
            expect(Data.dataUnion([1], { 3: 4 }, [9, 8, 7, 6])).toEqual({
                0: 1,
                1: 8,
                2: 7,
                3: 4,
            });
        });

        it("returns an empty list when every operand is nullish", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "union-all-nullish"
            expect(Data.dataUnion(null, undefined)).toEqual([]);
        });

        it("lets the left operand win even when its value is undefined", () => {
            // PHP-verified: ["a"=>null] + ["a"=>1] -> {"a":null}
            // (docs/php-parity/task-07-pad-union.json).
            const result = Data.dataUnion({ a: undefined }, { a: 1 });
            expect(result).toEqual({ a: undefined });
            // toEqual({ a: undefined }) alone would also pass against {}
            // (Vitest 4 treats an undefined-valued key as equal to an
            // absent one); assert the key actually exists too.
            expect(result).toHaveProperty("a");
        });

        it("treats a nullish operand as empty rather than a shape mismatch", () => {
            // collect([10,20])->union(null) -> [10,20]: getArrayableItems
            // casts null to [], so it says nothing about the backing.
            expect(Data.dataUnion([10, 20], null)).toEqual([10, 20]);
            expect(Data.dataUnion({ a: 1 }, undefined)).toEqual({ a: 1 });
            expect(Data.dataUnion(null, [10, 20])).toEqual([10, 20]);
        });

        it("unwraps a Collection-like operand", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C18 union collection"
            expect(
                Data.dataUnion(
                    { name: "Hello" },
                    collectionLike({ name: "World", id: 1 }) as never,
                ),
            ).toEqual({ name: "Hello", id: 1 });
        });

        it("wraps a scalar or string backing as a one item list, which then wins", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "d7-union-scalar-backing":
            // both recorded values are LISTS, because PHP's wrap of a scalar is [5].
            expect(Data.dataUnion(5, [9])).toEqual([5]);
            expect(Data.dataUnion("x", [9])).toEqual(["x"]);
            // JS-only: the keyed mirror. PHP's [0 => 5] IS that list, so the same row
            // stands for both; this port's two backings each answer in their own shape,
            // and only the shape differs — the one entry still wins.
            expect(Data.dataUnion({ 0: 5 }, [9])).toEqual({ 0: 5 });
        });

        it("materializes a Traversable backing instead of losing it", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "d7-union-traversable-backing"
            expect(Data.dataUnion(new Set([1, 2]), { d: 4 })).toEqual({
                0: 1,
                1: 2,
                d: 4,
            });
            expect(Data.dataUnion(new Set([1, 2]), [9, 9, 9])).toEqual([
                1, 2, 9,
            ]);
            // The keyed mirror of the same backing, which needs no materializing.
            expect(Data.dataUnion({ 0: 1, 1: 2 }, { d: 4 })).toEqual({
                0: 1,
                1: 2,
                d: 4,
            });
        });

        it("keeps a sparse list backing's hole, interior or trailing (F-19)", () => {
            // JS-only: PHP has no array hole. `arr.union` fills one with `undefined`, so
            // a sparse backing must answer exactly like the dense list it stands for —
            // and a TRAILING hole declares no own key, so it needs materializing first.
            expect(Data.dataUnion(sparseList(), {})).toStrictEqual([
                "a",
                undefined,
                "c",
            ]);
            expect(Data.dataUnion(trailingHoleList(), {})).toStrictEqual([
                "a",
                undefined,
                undefined,
            ]);
            expect(Data.dataUnion(trailingHoleList(), {})).toStrictEqual(
                Data.dataUnion(["a", undefined, undefined], {}),
            );
            // The three siblings that also fill a hole answer the same way for both shapes.
            expect(
                Data.dataPrepend(trailingHoleList(), "z", "k"),
            ).toStrictEqual({ 0: "a", 1: undefined, 2: undefined, k: "z" });
            expect(
                Data.dataReplace(trailingHoleList(), { 0: "x" }),
            ).toStrictEqual(["x", undefined, undefined]);
            expect(
                Data.dataReplaceRecursive(trailingHoleList(), { 0: "x" }),
            ).toStrictEqual(["x", undefined, undefined]);
            // The keyed backing has no hole to fill: a genuine gap stays a gap.
            expect(Data.dataUnion({ 0: "a" }, { 9: "z" })).toStrictEqual({
                0: "a",
                9: "z",
            });
        });

        it("normalizes a Map backing the way dispatch would", () => {
            // JS-only: PHP has no Map. `toKeyedData` builds the record it mirrors, and the
            // two must answer alike — the hand-written body used to drop the Map entirely.
            const asMap = new Map([
                ["a", 1],
                ["b", 2],
                ["c", 3],
            ]);
            expect(Data.dataUnion(asMap, { d: 4 })).toEqual({
                a: 1,
                b: 2,
                c: 3,
                d: 4,
            });
            expect(Data.dataUnion(asMap, { d: 4 })).toEqual(
                Data.dataUnion({ a: 1, b: 2, c: 3 }, { d: 4 }),
            );
        });

        it("reads the backing by its own entries, never calling a function-valued all member", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "union-function-valued-member"
            let calls = 0;
            const all = () => {
                calls++;

                return "X";
            };

            expect(Data.dataUnion({ all, admin: all }, { guest: all })).toEqual(
                { all, admin: all, guest: all },
            );
            expect(calls).toBe(0);
        });
    });

    describe("dataExcept", () => {
        it("is object", () => {
            const result = Data.dataExcept(
                { name: "John", age: 30, city: "NYC" },
                "age",
            );
            expect(result).toEqual({
                name: "John",
                city: "NYC",
            });
        });

        it("is array", () => {
            const result = Data.dataExcept([1, 2, 3, 4], [1, 3]);
            expect(result).toEqual([1, 3]);
        });

        it("removes a dot-notation path, through the object backing", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "except-single-dot-path"
            expect(
                Data.dataExcept(
                    {
                        name: "taylor",
                        framework: { language: "PHP", name: "Laravel" },
                    },
                    "framework.language",
                ),
            ).toEqual({ name: "taylor", framework: { name: "Laravel" } });
        });

        it("removes a numeric key given as a number or as its string form", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "except-int-key"
            // docs/php-parity/task-24-data-release-readiness.json, "except-string-key"
            expect(
                Data.dataExcept({ 1: "hAz", 2: { 5: "foo", 12: "baz" } }, 2),
            ).toEqual({
                1: "hAz",
            });
            expect(Data.dataExcept({ 1: "hAz", 2: "x" }, "2")).toEqual({
                1: "hAz",
            });
        });

        it("treats a null key as a no-op", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "collection-except-null"
            expect(Data.dataExcept({ a: 1, b: 2 }, null)).toEqual({
                a: 1,
                b: 2,
            });
            expect(Data.dataExcept([1, 2, 3], null)).toEqual([1, 2, 3]);
        });
    });

    describe("dataExists", () => {
        it("is object", () => {
            expect(Data.dataExists({ a: 1, b: 2 }, "a")).toBe(true);
            expect(Data.dataExists({ a: 1, b: 2 }, "c")).toBe(false);
        });

        it("is array", () => {
            expect(Data.dataExists([1, 2, 3], 1)).toBe(true);
            expect(Data.dataExists([1, 2, 3], 5)).toBe(false);
        });

        it("dataExists resolves a literal dotted key before traversing, through the object backing", () => {
            // PHP-verified: docs/php-parity/task-09-paths.json, "Arr::exists
            // — literal dotted key".
            expect(
                Data.dataExists({ "products.desk": {} }, "products.desk"),
            ).toBe(true);
        });

        it("finds a key holding null and casts a null key to the empty string", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "exists-null-value", "exists-null-key-empty-string"
            expect(Data.dataExists({ a: null }, "a")).toBe(true);
            expect(Data.dataExists({ "": 1 }, null)).toBe(true);
        });

        it("does not find a non-canonical or null key in a list", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "exists-list-non-canonical-keys", "exists-list-null-and-float-keys"
            expect(Data.dataExists([1, 2, 3], "01")).toBe(false);
            expect(Data.dataExists([1, 2, 3], null)).toBe(false);
        });

        it("looks -0 up as the key '-0', through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "exists-float-key-cast"
            expect(Data.dataExists({ 0: 1 }, -0)).toBe(false);
            expect(Data.dataExists({ "-0": 1 }, -0)).toBe(true);
        });

        it("looks -0 up as the key '-0', through the list backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "exists-float-key-cast"
            expect(Data.dataExists([1], -0)).toBe(false);
        });
    });

    describe("dataTake", () => {
        it("is object", () => {
            const result = Data.dataTake({ a: 1, b: 2, c: 3, d: 4 }, 2);
            expect(result).toEqual({
                a: 1,
                b: 2,
            });
        });

        it("is array", () => {
            const result = Data.dataTake([1, 2, 3, 4, 5], 3);
            expect(result).toEqual([1, 2, 3]);
        });

        it("takes the tail for a negative limit", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "take-negative", "take-assoc-negative"
            expect(Data.dataTake([1, 2, 3, 4, 5, 6], -3)).toEqual([4, 5, 6]);
            expect(Data.dataTake({ a: 1, b: 2, c: 3, d: 4 }, -2)).toEqual({
                c: 3,
                d: 4,
            });
        });

        it("returns nothing for a zero limit", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "take-zero", "collection-take-zero"
            expect(Data.dataTake([1, 2, 3, 4, 5, 6], 0)).toEqual([]);
            expect(Data.dataTake({ a: 1, b: 2, c: 3, d: 4 }, 0)).toEqual({});
        });

        it("returns everything when the limit exceeds the size, in either sign", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "take-over-size", "take-negative-over-size", "take-assoc-over-size",
            // "take-assoc-negative-over-size"
            expect(Data.dataTake([1, 2, 3, 4, 5, 6], 10)).toEqual([
                1, 2, 3, 4, 5, 6,
            ]);
            expect(Data.dataTake([1, 2, 3, 4, 5, 6], -10)).toEqual([
                1, 2, 3, 4, 5, 6,
            ]);
            expect(Data.dataTake({ a: 1, b: 2 }, 10)).toEqual({ a: 1, b: 2 });
            expect(Data.dataTake({ a: 1, b: 2 }, -10)).toEqual({ a: 1, b: 2 });
        });

        it("keeps the original keys when taking the tail of an object backing", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "collection-take-negative-keeps-keys":
            // collect(['taylor','dayle','shawn'])->take(-2) -> [1 => 'dayle', 2 => 'shawn'].
            // JS-only: a list cannot hold sparse keys, so it renumbers; the object backing shows the shape.
            const result = Data.dataTake(
                { 0: "taylor", 1: "dayle", 2: "shawn" },
                -2,
            );
            expect(result).toEqual({ 1: "dayle", 2: "shawn" });
            expect(Object.keys(result)).toEqual(["1", "2"]);
        });
    });

    describe("dataFlatten", () => {
        it("is object", () => {
            // Arr::flatten(..., 1) spends its last level of depth on each
            // container's own values, so one level of nesting survives.
            const result = Data.dataFlatten(
                {
                    users: { john: { name: "John" }, jane: { name: "Jane" } },
                    posts: { "1": { title: "Hello" } },
                },
                1,
            );

            expect(result).toEqual([
                { name: "John" },
                { name: "Jane" },
                { title: "Hello" },
            ]);
        });

        it("is object with array values", () => {
            const result = Data.dataFlatten({ list: ["x", "y"] }, 1);
            expect(result).toEqual(["x", "y"]);
        });

        it("is object with deeper nesting", () => {
            const data = { a: { b: { c: 1 } } };

            expect(Data.dataFlatten(data, 2)).toEqual([1]);
            expect(Data.dataFlatten(data)).toEqual([1]);
        });

        // docs/php-parity/task-17-second-review.json, "Arr::flatten defaults to unlimited depth"
        it("flattens to unlimited depth by default", () => {
            const data = { a: { b: { c: { d: 1 } } } };

            expect(Data.dataFlatten(data)).toEqual([1]);
        });

        // docs/php-parity/task-17-second-review.json, "Arr::flatten honours an explicit depth of 2"
        it("stops at an explicit depth", () => {
            const data = { a: { b: { c: { d: 1 } } } };

            expect(Data.dataFlatten(data, 2)).toEqual([{ d: 1 }]);
        });
        it("is array", () => {
            const result = Data.dataFlatten([["#foo", ["#bar"]], ["#baz"]]);
            expect(result).toEqual(["#foo", "#bar", "#baz"]);

            const result2 = ["#foo", { key: "#bar" }, { key: "#baz" }, "#zap"];
            expect(Data.dataFlatten(result2, 1)).toEqual([
                "#foo",
                "#bar",
                "#baz",
                "#zap",
            ]);
        });

        it("keeps a class instance or Date whole, through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "flatten-object-leaf"
            const point = new Point();
            const date = new Date(0);
            const result = Data.dataFlatten({ a: point, b: [date] });

            expect(result).toHaveLength(2);
            expect(result[0]).toBe(point);
            expect(result[1]).toBe(date);
        });

        it("keeps a class instance or Date whole, through the list backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "flatten-object-leaf"
            const point = new Point();
            const date = new Date(0);
            const result = Data.dataFlatten([date, [point]]);

            expect(result).toHaveLength(2);
            expect(result[0]).toBe(date);
            expect(result[1]).toBe(point);
        });
    });

    describe("dataFlip", () => {
        it("is object", () => {
            const result = Data.dataFlip({ a: 1, b: 2, c: 3 });
            expect(result).toEqual({ 1: "a", 2: "b", 3: "c" });
        });

        it("is array", () => {
            const result = Data.dataFlip(["apple", "banana", "cherry"]);
            expect(result).toEqual({
                apple: 0,
                banana: 1,
                cherry: 2,
            });
        });

        it("is object with unsupported values skipped", () => {
            const result = Data.dataFlip({
                string: "taylor",
                integer: 1,
                null: null,
                false: false,
                true: true,
                float: 1.5,
                array: [],
                object: {},
            });
            expect(result).toEqual({ taylor: "string", 1: "integer" });
        });

        it("is array with unsupported values skipped", () => {
            const result = Data.dataFlip([
                "a",
                1,
                null,
                false,
                true,
                1.5,
                [],
                {},
            ]);
            expect(result).toEqual({ a: 0, 1: 1 });
        });

        it("is object with numbers beyond PHP's integer range skipped", () => {
            expect(Data.dataFlip({ huge: 1e21 })).toEqual({});
        });

        it("is array with numbers beyond PHP's integer range skipped", () => {
            expect(Data.dataFlip([1e21])).toEqual({});
        });

        it("is object keeping __proto__ as an own key", () => {
            const result = Data.dataFlip({ a: "__proto__" });

            expect(Object.hasOwn(result, "__proto__")).toBe(true);
            expect(result["__proto__"]).toBe("a");
        });

        it("is array keeping __proto__ as an own key", () => {
            const result = Data.dataFlip(["__proto__"]);

            expect(Object.hasOwn(result, "__proto__")).toBe(true);
            expect(result["__proto__"]).toBe(0);
        });
    });

    describe("dataFloat", () => {
        it("is object", () => {
            const result = Data.dataFloat(
                { price: 19.99, discount: 0.1 },
                "price",
            );
            expect(result).toBe(19.99);
        });

        it("is array", () => {
            const result = Data.dataFloat([1.5, 2.3], 1);
            expect(result).toBe(2.3);
        });

        it("throws when the value is not a number, naming the backing in the message", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "float-string-value", "float-list-int-key"
            // JS-only: @tolki/obj reports "Object value for key [...]" because it is the
            // object-shaped port of the same helper; PHP has only the array prefix.
            expect(() =>
                Data.dataFloat({ string: "foo bar" }, "string"),
            ).toThrow(
                "Object value for key [string] must be a float, string found.",
            );
            expect(() => Data.dataFloat(["foo bar"], 0)).toThrow(
                "Array value for key [0] must be a float, string found.",
            );
        });

        it("falls back to the default for a missing key", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "float-missing-key-default"
            expect(Data.dataFloat({}, "missing", 1.5)).toBe(1.5);
            expect(Data.dataFloat([], 0, 1.5)).toBe(1.5);
        });

        it("throws for a missing key when no default is given", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "float-missing-key-no-default", "float-list-missing-index-no-default"
            // JS-only: the object backing says "Object value for key [...]"; PHP has only the array prefix.
            expect(() => Data.dataFloat({}, "missing")).toThrow(
                "Object value for key [missing] must be a float, NULL found.",
            );
            expect(() => Data.dataFloat([], 0)).toThrow(
                "Array value for key [0] must be a float, NULL found.",
            );
        });
    });

    describe("dataForget", () => {
        it("is object", () => {
            const result = Data.dataForget(
                { name: "John", age: 30, city: "NYC" },
                "age",
            );
            expect(result).toEqual({ name: "John", city: "NYC" });
        });

        it("is array", () => {
            const result = Data.dataForget(
                ["products", ["desk", [100]]],
                "1.1",
            );
            expect(result).toEqual(["products", ["desk"]]);
        });

        it("resolves a top-level key following a dot key against the top level", () => {
            const result = Data.dataForget(
                { users: { name: "Joe", id: 1 }, id: 99 },
                ["users.name", "id"],
            );
            expect(result).toEqual({ users: { id: 1 } });
        });

        it("resolves a top-level key following a deeper dot key against the top level", () => {
            const result = Data.dataForget(
                { products: { desk: { price: 100 } }, desk: "top-level" },
                ["products.desk.price", "desk"],
            );
            expect(result).toEqual({ products: { desk: {} } });
        });

        it("resolves a dot key following a deeper dot key from the top level", () => {
            const result = Data.dataForget(
                { a: { b: { c: 1, "e.d": "literal" } }, e: { d: 3 } },
                ["a.b.c", "e.d"],
            );
            expect(result).toEqual({
                a: { b: { "e.d": "literal" } },
                e: {},
            });
        });

        it("resolves a top-level index following a dot key against the top-level array", () => {
            const result = Data.dataForget([["x", "y"], "z"], ["0.1", 1]);
            expect(result).toEqual([["x"]]);
        });
    });

    describe("dataFrom", () => {
        it("is object", () => {
            const result = Data.dataFrom({ a: 1, b: 2, c: 3 });
            expect(result).toEqual({ a: 1, b: 2, c: 3 });
        });

        it("is array", () => {
            const result = Data.dataFrom([1, 2, 3]);
            expect(result).toEqual([1, 2, 3]);
        });

        it("is a Map", () => {
            expect(
                Data.dataFrom(
                    new Map([
                        ["a", 1],
                        ["b", 2],
                    ]),
                ),
            ).toEqual({ a: 1, b: 2 });
        });

        it("is an iterable", () => {
            expect(Data.dataFrom(new Set([1, 2]))).toEqual([1, 2]);
            expect(
                Data.dataFrom(
                    (function* () {
                        yield 1;
                        yield 2;
                    })(),
                ),
            ).toEqual([1, 2]);
        });
    });

    describe("dataGet", () => {
        it("is object", () => {
            const result = Data.dataGet({ a: 1, b: 2 }, "c", "default");
            expect(result).toBe("default");
        });

        it("is array", () => {
            const result = Data.dataGet([1, 2, 3], 1, "default");
            expect(result).toBe(2);
        });

        it("dataGet resolves a literal dotted key before traversing, through the object backing", () => {
            // PHP-verified: docs/php-parity/task-09-paths.json, "Arr::get
            // — literal dotted key wins".
            const result = Data.dataGet(
                { "products.desk": { price: 100 } },
                "products.desk",
            );
            expect(result).toEqual({ price: 100 });
        });

        it("traverses a nested list with numeric segments, through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "get-through-list", "get-through-list-2", "get-through-list-missing"
            const obj = { products: [{ name: "desk" }, { name: "chair" }] };

            expect(Data.dataGet(obj, "products.0.name")).toBe("desk");
            expect(Data.dataGet(obj, "products.1.name")).toBe("chair");
            expect(Data.dataGet(obj, "products.2.name", "none")).toBe("none");
        });

        it("returns the default for a non-canonical index, through the list backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "get-list-non-canonical-index"
            expect(Data.dataGet(["x", "y"], "01", "d")).toBe("d");
            expect(Data.dataGet([["x", "y"]], "0.1e0", "d")).toBe("d");
        });

        it("looks an integer segment up as the own key of an object, through the list backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "get-list-int-segment-into-map"
            expect(Data.dataGet([{ k: "v", 0: "x" }], "0.0", "d")).toBe("x");
        });
    });

    describe("dataHas", () => {
        it("is object", () => {
            const result = Data.dataHas({ a: 1, b: 2 }, ["a", "c"]);
            expect(result).toBe(false);
        });

        it("is array", () => {
            const result = Data.dataHas([1, 2, 3], [0, 1]);
            expect(result).toBe(true);
        });

        it("dataHas resolves a literal dotted key before traversing, through the object backing", () => {
            // PHP-verified: docs/php-parity/task-09-paths.json, "Arr::has
            // — literal dotted key".
            expect(
                Data.dataHas(
                    { "products.desk": { price: 100 } },
                    "products.desk",
                ),
            ).toBe(true);
        });

        it("finds a numeric key on a plain object, not only on arrays", () => {
            // PHP-verified: docs/php-parity/task-09-paths.json, "Arr::has
            // — numeric key".
            expect(Data.dataHas({ 123: "x" }, 123)).toBe(true);
        });

        it("does not leak Array.prototype through the array backing", () => {
            expect(Data.dataHas([1, 2], "length")).toBe(false);
            expect(Data.dataHas([1, 2], "toString")).toBe(false);
        });

        it("looks up the empty-string key for a null inside a key list, through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "has-empty-string-key-null-in-list"
            expect(Data.dataHas({ "": "some" }, [null])).toBe(true);
        });
    });

    describe("dataHasAll", () => {
        it("is object", () => {
            const result = Data.dataHasAll({ a: 1, b: 2 }, ["a", "c"]);
            expect(result).toBe(false);
        });

        it("is array", () => {
            const result = Data.dataHasAll([1, 2, 3], [0, 1]);
            expect(result).toBe(true);
        });

        it("counts an empty-string and a null value as present", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "hasAll-empty-and-null-values-count-as-present"
            const data = { name: "Taylor", age: "", city: null };
            expect(Data.dataHasAll(data, "name")).toBe(true);
            expect(Data.dataHasAll(data, "age")).toBe(true);
            expect(Data.dataHasAll(data, "city")).toBe(true);
            expect(Data.dataHasAll(data, ["name", "age", "city"])).toBe(true);
            expect(Data.dataHasAll(data, ["age", "car"])).toBe(false);
            expect(
                Data.dataHasAll(data, ["name", "age", "city", "country"]),
            ).toBe(false);
        });

        it("resolves dot paths", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "hasAll-dot-paths", "hasAll-through-list"
            expect(
                Data.dataHasAll({ user: { name: "Taylor" } }, ["user.name"]),
            ).toBe(true);
            expect(
                Data.dataHasAll({ user: { name: "Taylor" } }, ["user.age"]),
            ).toBe(false);
            expect(Data.dataHasAll([{ name: "John" }], ["0.name"])).toBe(true);
        });

        it("is false for an empty key list", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "hasAll-empty-key-list", "hasAll-empty-key-list-list"
            expect(Data.dataHasAll({ a: 1 }, [])).toBe(false);
            expect(Data.dataHasAll([1, 2, 3], [])).toBe(false);
        });
    });

    describe("dataHasAny", () => {
        it("is object", () => {
            const result = Data.dataHasAny({ a: 1, b: 2 }, ["c", "d"]);
            expect(result).toBe(false);
        });

        it("is array", () => {
            const result = Data.dataHasAny([1, 2, 3], [0, 5]);
            expect(result).toBe(true);
        });

        it("is true as soon as one key exists, even when its value is null or empty", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "hasAny-dot-over-null-and-empty", "hasAny-true-hits"
            expect(Data.dataHasAny({ name: null, email: "" }, ["name"])).toBe(
                true,
            );
            expect(
                Data.dataHasAny({ user: { name: null } }, ["user.name"]),
            ).toBe(true);
            expect(
                Data.dataHasAny({ name: "Taylor" }, ["surname", "name"]),
            ).toBe(true);
            expect(Data.dataHasAny({ a: 1 }, ["x", "y"])).toBe(false);
        });

        it("is true as soon as one key exists, even when its value is null, through the list backing", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "hasAny-list-null-and-empty"
            expect(Data.dataHasAny([null, "x"], [0])).toBe(true);
            expect(Data.dataHasAny(["Taylor", "Otwell"], [5, 0])).toBe(true);
            expect(Data.dataHasAny([1], [5, 9])).toBe(false);
        });

        it("accepts a bare scalar key", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "hasAny-true-hits"
            expect(Data.dataHasAny({ name: "Taylor" }, "name")).toBe(true);
            expect(Data.dataHasAny([1, 2, 3], [5, 1])).toBe(true);
        });
    });

    describe("dataEvery", () => {
        it("is object", () => {
            const result = Data.dataEvery(
                { a: 2, b: 4 },
                (value) => value % 2 === 0,
            );
            expect(result).toBe(true);
        });

        it("is array", () => {
            const result = Data.dataEvery(
                [2, 4, 6],
                (value) => value % 2 === 0,
            );
            expect(result).toBe(true);
            expect(Data.dataEvery([1, 2, 3], (value) => value % 2 === 0)).toBe(
                false,
            );
        });

        it("is a Map", () => {
            const items = new Map([
                ["first", 2],
                ["second", 4],
            ]);

            // A Map reaches obj's widest row, whose callback takes `unknown`.
            expect(
                Data.dataEvery(items, (value) => Number(value) % 2 === 0),
            ).toBe(true);
            expect(
                Data.dataEvery(items, (_value, key) => key === "first"),
            ).toBe(false);
        });

        it("is an iterable", () => {
            const items = () =>
                (function* () {
                    yield 2;
                    yield 4;
                })();

            // Guards the streaming normalizer these four pass explicitly: it hands the Set
            // or generator on UNREAD, so an infinite generator still answers.
            expect(Data.dataEvery(items(), (value) => value % 2 === 0)).toBe(
                true,
            );
            expect(Data.dataEvery(items(), (value) => value > 2)).toBe(false);
            expect(
                Data.dataEvery(new Set([2, 4]), (value) => value % 2 === 0),
            ).toBe(true);
        });

        it("is a scalar", () => {
            expect(Data.dataEvery(5 as unknown as number[], () => true)).toBe(
                true,
            );
        });
    });

    describe("dataSome", () => {
        it("is object", () => {
            const result = Data.dataSome({ a: 1, b: 2 }, (value) => value > 2);
            expect(result).toBe(false);
        });

        it("is array", () => {
            const result = Data.dataSome([1, 2, 3], (value) => value > 2);
            expect(result).toBe(true);
        });

        it("is a Map", () => {
            const items = new Map([
                ["first", 1],
                ["second", 2],
            ]);

            expect(
                Data.dataSome(
                    items,
                    (value, key) => key === "second" && value === 2,
                ),
            ).toBe(true);
            // A Map reaches obj's widest row, whose callback takes `unknown`.
            expect(Data.dataSome(items, (value) => Number(value) > 5)).toBe(
                false,
            );
        });

        it("is an iterable", () => {
            const items = () =>
                (function* () {
                    yield 1;
                    yield 2;
                })();

            // Guards the streaming normalizer these four pass explicitly: it hands the Set
            // or generator on UNREAD, so an infinite generator still answers.
            expect(Data.dataSome(items(), (value) => value % 2 === 0)).toBe(
                true,
            );
            expect(Data.dataSome(items(), (value) => value > 5)).toBe(false);
            expect(Data.dataSome(new Set([1, 2]), (value) => value > 1)).toBe(
                true,
            );
        });

        it("is a scalar", () => {
            expect(Data.dataSome(5 as unknown as number[], () => true)).toBe(
                true,
            );
        });
    });

    describe("dataInteger", () => {
        it("is object", () => {
            const result = Data.dataInteger({ count: 42 }, "count", 0);
            expect(result).toBe(42);

            expect(Data.dataInteger({}, "missing", 5)).toBe(5);

            expect(Data.dataInteger({ count: 42 }, "count")).toBe(42);
        });

        it("is array", () => {
            const result = Data.dataInteger([1, 2, 3], 0, 0);
            expect(result).toBe(1);

            expect(Data.dataInteger([10, 20, 30], 1)).toBe(20);
            // docs/php-parity/task-24-data-release-readiness.json, "integer-list-missing-index-with-default"
            expect(Data.dataInteger([], 0, 5)).toBe(5);
        });

        it("throws when the value is not an integer, naming the backing in the message", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "integer-string-value", "integer-list-int-key"
            // JS-only: @tolki/obj reports "Object value for key [...]" because it is the
            // object-shaped port of the same helper; PHP has only the array prefix.
            expect(() =>
                Data.dataInteger({ string: "foo bar" }, "string"),
            ).toThrow(
                "Object value for key [string] must be an integer, string found.",
            );
            expect(() => Data.dataInteger(["foo bar"], 0)).toThrow(
                "Array value for key [0] must be an integer, string found.",
            );
        });

        it("rejects a non-whole number, reporting PHP's type name for it", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "integer-float-value", "integer-float-value-list"
            expect(() => Data.dataInteger({ a: 1.5 }, "a")).toThrow(
                "Object value for key [a] must be an integer, double found.",
            );
            expect(() => Data.dataInteger([1.5], 0)).toThrow(
                "Array value for key [0] must be an integer, double found.",
            );
        });

        it("throws for a missing key when no default is given", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "integer-missing-key-no-default", "integer-list-missing-index-no-default"
            // JS-only: the object backing says "Object value for key [...]"; PHP has only the array prefix.
            expect(() => Data.dataInteger({}, "missing")).toThrow(
                "Object value for key [missing] must be an integer, NULL found.",
            );
            expect(() => Data.dataInteger([], 0)).toThrow(
                "Array value for key [0] must be an integer, NULL found.",
            );
        });
    });

    describe("dataJoin", () => {
        it("is object", () => {
            const result = Data.dataJoin(
                { a: "hello", b: "world", c: "test" },
                ", ",
                " and ",
            );
            expect(result).toBe("hello, world and test");

            expect(Data.dataJoin(["a", "b", "c"], ", ", " and ")).toBe(
                "a, b and c",
            );
        });

        it("is array", () => {
            const result = Data.dataJoin(["a", "b", "c"], ", ", " and ");
            expect(result).toBe("a, b and c");

            expect(Data.dataJoin([1, 2, 3], ", ")).toBe("1, 2, 3");
        });

        it("joins two, one and zero elements", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "join-assoc-two"
            // docs/php-parity/task-24-data-release-readiness.json, "join-single", "join-empty"
            expect(Data.dataJoin({ a: "a", b: "b" }, ", ", " and ")).toBe(
                "a and b",
            );
            expect(Data.dataJoin({ a: "a" }, ", ", " and ")).toBe("a");
            expect(Data.dataJoin({}, ", ", " and ")).toBe("");
            expect(Data.dataJoin(["a"], ", ", " and ")).toBe("a");
            expect(Data.dataJoin([], ", ", " and ")).toBe("");
        });

        it("ignores the final glue when it is empty", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "join-three-no-final-glue", "join-assoc-numbers"
            expect(Data.dataJoin(["a", "b", "c"], ", ")).toBe("a, b, c");
            expect(Data.dataJoin({ a: 1, b: 2, c: 3 }, ", ")).toBe("1, 2, 3");
        });
    });

    describe("dataKeyBy", () => {
        it("is object", () => {
            const data = {
                user1: { id: 10, name: "John" },
                user2: { id: 20, name: "Jane" },
            };
            const result = Data.dataKeyBy(data, "id");
            expect(result).toEqual({
                10: { id: 10, name: "John" },
                20: { id: 20, name: "Jane" },
            });
        });

        it("is array", () => {
            const users = [
                { id: 1, name: "John" },
                { id: 2, name: "Jane" },
                { id: 3, name: "Bob" },
            ];
            const result = Data.dataKeyBy(users, "id");
            expect(result).toEqual({
                1: { id: 1, name: "John" },
                2: { id: 2, name: "Jane" },
                3: { id: 3, name: "Bob" },
            });
        });

        it("hands the callback each item's key, a list's index included", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "keyBy-list-callback-key", "keyBy callback receives the key"
            expect(
                Data.dataKeyBy([{ id: 1 }, { id: 2 }], (_, key) => `k${key}`),
            ).toEqual({ k0: { id: 1 }, k1: { id: 2 } });
            expect(Data.dataKeyBy({ x: { id: 1 } }, (_, key) => key)).toEqual({
                x: { id: 1 },
            });
        });

        it("keys array items with a null key value under an empty string key", () => {
            const users = [
                { rating: 1, name: "1" },
                { rating: 2, name: null },
            ];
            const result = Data.dataKeyBy(users, "name");
            expect(result).toEqual({
                1: { rating: 1, name: "1" },
                "": { rating: 2, name: null },
            });
        });

        it("keys object items with a null key value under an empty string key", () => {
            const users = {
                first: { rating: 1, name: "1" },
                second: { rating: 2, name: null },
            };
            const result = Data.dataKeyBy(users, "name");
            expect(result).toEqual({
                1: { rating: 1, name: "1" },
                "": { rating: 2, name: null },
            });
        });

        it("casts a bool key the way PHP stores an array offset, through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "keyBy-scalar-key-cast"
            expect(
                Data.dataKeyBy({ a: { k: true }, b: { k: false } }, "k"),
            ).toEqual({ 1: { k: true }, 0: { k: false } });
        });

        it("casts a bool key the way PHP stores an array offset, through the list backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "keyBy-scalar-key-cast"
            expect(Data.dataKeyBy([{ k: true }, { k: false }], "k")).toEqual({
                1: { k: true },
                0: { k: false },
            });
        });
    });

    describe("dataPrependKeysWith", () => {
        it("is object", () => {
            const result = Data.dataPrependKeysWith(
                { name: "John", age: 30 },
                "user_",
            );
            expect(result).toEqual({ user_name: "John", user_age: 30 });
        });

        it("is array", () => {
            const result = Data.dataPrependKeysWith(["a", "b", "c"], "item_");
            expect(result).toEqual({
                item_0: "a",
                item_1: "b",
                item_2: "c",
            });
        });

        it("keeps a prefix that ends in a dot and leaves nested values untouched", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "prependKeysWith-literal"
            expect(
                Data.dataPrependKeysWith(
                    {
                        id: "123",
                        data: "456",
                        list: [1, 2, 3],
                        meta: { key: 1 },
                    },
                    "test.",
                ),
            ).toEqual({
                "test.id": "123",
                "test.data": "456",
                "test.list": [1, 2, 3],
                "test.meta": { key: 1 },
            });
        });

        it("prefixes a list's indices, returning a keyed result", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "prependKeysWith-two-item-list"
            expect(Data.dataPrependKeysWith(["a", "b"], "p.")).toEqual({
                "p.0": "a",
                "p.1": "b",
            });
        });
    });

    describe("dataOnly", () => {
        it("is object", () => {
            const result = Data.dataOnly({ a: 1, b: 2, c: 3 }, ["a", "c"]);
            expect(result).toEqual({
                a: 1,
                c: 3,
            });
        });
        it("is array", () => {
            const result = Data.dataOnly([1, 2, 3, 4], [0, 2]);
            expect(result).toEqual([1, 3]);
        });

        it("returns nothing for a null key list or a key that does not exist", () => {
            // docs/php-parity/task-11-final-fixes.json, "only casts a null key to an empty key list"
            // docs/php-parity/task-23-obj-release-readiness.json, "only-none-exist"
            expect(Data.dataOnly({ a: 1, b: 2 }, null)).toEqual({});
            expect(Data.dataOnly([10, 20, 30, 40], null)).toEqual([]);
            expect(
                Data.dataOnly({ name: "Desk", price: 100 }, ["nonExistingKey"]),
            ).toEqual({});
        });

        it("accepts a bare scalar key on either backing", () => {
            // docs/php-parity/task-11-final-fixes.json, "only accepts a bare scalar key"
            // docs/php-parity/task-23-obj-release-readiness.json, "only-mixed-string"
            expect(Data.dataOnly({ 0: "foo", bar: "baz" }, "bar")).toEqual({
                bar: "baz",
            });
            expect(Data.dataOnly([10, 20, 30, 40], 1)).toEqual([20]);
        });
    });

    describe("dataSelect", () => {
        it("is object", () => {
            const result = Data.dataSelect(
                {
                    user1: { name: "John", age: 30, city: "NYC" },
                    user2: { name: "Jane", age: 25, city: "LA" },
                },
                ["name", "city"],
            );
            expect(result).toEqual({
                user1: { name: "John", city: "NYC" },
                user2: { name: "Jane", city: "LA" },
            });
        });
        it("is array", () => {
            const result = Data.dataSelect(
                [
                    { a: 1, b: 2, c: 3 },
                    { a: 4, b: 5, c: 6 },
                ],
                ["a", "b"],
            );
            expect(result).toEqual([
                { a: 1, b: 2 },
                { a: 4, b: 5 },
            ]);
        });

        it("accepts a bare string key", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "select-bare-existing-key", "select-bare-key-list"
            expect(
                Data.dataSelect(
                    {
                        a: { name: "Taylor", age: 1 },
                        b: { name: "Abigail", age: 2 },
                    },
                    "name",
                ),
            ).toEqual({ a: { name: "Taylor" }, b: { name: "Abigail" } });
            expect(
                Data.dataSelect(
                    [
                        { a: 1, b: 2 },
                        { a: 3, b: 4 },
                    ],
                    "a",
                ),
            ).toEqual([{ a: 1 }, { a: 3 }]);
        });

        it("returns an empty row per item for a missing key or a null key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "select-missing", "select-null"
            // docs/php-parity/task-24-data-release-readiness.json, "select-missing-and-null-list"
            expect(
                Data.dataSelect(
                    {
                        a: { name: "T", role: "D" },
                        b: { name: "A", role: "I" },
                    },
                    "nonExistingKey",
                ),
            ).toEqual({ a: {}, b: {} });
            expect(
                Data.dataSelect({ a: { name: "T" }, b: { name: "A" } }, null),
            ).toEqual({ a: {}, b: {} });
            expect(
                Data.dataSelect(
                    [{ name: "T" }, { name: "A" }],
                    "nonExistingKey",
                ),
            ).toEqual([{}, {}]);
            expect(
                Data.dataSelect([{ name: "T" }, { name: "A" }], null),
            ).toEqual([{}, {}]);
        });
    });

    describe("dataMapWithKeys", () => {
        it("is object", () => {
            const obj = { user1: "John", user2: "Jane" };
            const result = Data.dataMapWithKeys(obj, (value, key) => ({
                [`name_${String(key)}`]: (value as string).toUpperCase(),
            }));
            expect(result).toEqual({ name_user1: "JOHN", name_user2: "JANE" });
        });
        it("is array", () => {
            const users = [
                { id: 1, name: "John" },
                { id: 2, name: "Jane" },
            ];
            const result = Data.dataMapWithKeys(users, (item) => ({
                [item.name]: item.id,
            }));
            expect(result).toEqual({
                John: 1,
                Jane: 2,
            });
        });

        it("is array with a [key, value] tuple callback", () => {
            const result = Data.dataMapWithKeys([1, 2], (value, index) => [
                `key_${String(index)}`,
                value * 2,
            ]);
            expect(result).toEqual({ key_0: 2, key_1: 4 });
        });

        it("is object with a [key, value] tuple callback", () => {
            const obj = { a: 1, b: 2 };
            const result = Data.dataMapWithKeys(obj, (value, key) => [
                `key_${String(key)}`,
                value * 2,
            ]);
            expect(result).toEqual({ key_a: 2, key_b: 4 });
        });

        // Arr::mapWithKeys (Arr.php:880) builds one plain array; there is no Map in
        // PHP. Array- and object-backed data must agree, per the unison rule.
        it("returns a plain object even for numeric-like mapped keys, either backing", () => {
            const fromArray = Data.dataMapWithKeys([1, 2], (value) => ({
                [value]: value,
            }));
            expect(fromArray instanceof Map).toBe(false);
            expect(fromArray).toEqual({ 1: 1, 2: 2 });

            const fromObject = Data.dataMapWithKeys(
                { a: 1, b: 2 },
                (value) => ({ [value]: value }),
            );
            expect(fromObject instanceof Map).toBe(false);
            expect(fromObject).toEqual({ 1: 1, 2: 2 });
        });
    });

    describe("dataMapSpread", () => {
        it("is object", () => {
            const obj = {
                user1: { name: "John", age: 25 },
                user2: { name: "Jane", age: 30 },
            };
            const result = Data.dataMapSpread(
                obj,
                (name, age) => `${name} is ${age}`,
            );
            expect(result).toEqual({
                user1: "John is 25",
                user2: "Jane is 30",
            });
        });
        it("is array", () => {
            const data: [number, number][] = [
                [1, 2],
                [3, 4],
            ];
            const result = Data.dataMapSpread(data, (a, b) => a + b);
            expect(result).toEqual([3, 7]);
        });

        it("spreads a list row and appends the key, through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "mapSpread-tuples", "mapSpread-tuples-key"
            const data = { x: [1, "a"], y: [2, "b"] };

            expect(
                Data.dataMapSpread(data, (n, c) => `${String(n)}-${String(c)}`),
            ).toEqual({ x: "1-a", y: "2-b" });

            // The callback's third argument is the appended key.
            expect(
                Data.dataMapSpread(
                    data,
                    (n, c, k) => `${String(n)}-${String(c)}-${String(k)}`,
                ),
            ).toEqual({ x: "1-a-x", y: "2-b-y" });
        });

        it("spreads a Collection-like row's items on the array backing", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "d6-map-spread-collection-row", "list"
            const rows = [{ all: () => [1, "a"] }, { all: () => [2, "b"] }];

            expect(
                Data.dataMapSpread(
                    rows,
                    (n, c, k) => `${String(n)}-${String(c)}-${String(k)}`,
                ),
            ).toEqual(["1-a-0", "2-b-1"]);
        });

        it("spreads a Collection-like row's items on the object backing", () => {
            // Same row, "assoc": Arr::mapSpread(['x' => new Collection([1, 'a'])], ...)
            const rows = {
                x: { all: () => [1, "a"] },
                y: { all: () => [2, "b"] },
            };

            expect(
                Data.dataMapSpread(
                    rows,
                    (n, c, k) => `${String(n)}-${String(c)}-${String(k)}`,
                ),
            ).toEqual({ x: "1-a-x", y: "2-b-y" });
        });
    });

    describe("dataPrepend", () => {
        it("casts its key the way PHP casts an array key on an object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "prepend-key-cast"
            expect(Data.dataPrepend({ a: 1, 1: 5 }, 9, 1.5)).toEqual({
                1: 9,
                a: 1,
            });
        });
        it("is object", () => {
            const result = Data.dataPrepend({ b: 2, c: 3 }, 1, "a");
            expect(result).toEqual({
                a: 1,
                b: 2,
                c: 3,
            });
        });
        it("is array", () => {
            const result = Data.dataPrepend([2, 3], 1);
            expect(result).toEqual([1, 2, 3]);
        });
        it("unshifts under key 0 when no key is given", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "prepend-assoc-no-key"
            expect(Data.dataPrepend({ one: 1, two: 2 }, 0)).toEqual({
                0: 0,
                one: 1,
                two: 2,
            });
        });
        it("renumbers a negative integer key when no key is given", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "prepend-negative-int-key-no-key"
            expect(Data.dataPrepend({ "-1": "a", x: "b" }, "z")).toEqual({
                0: "z",
                1: "a",
                x: "b",
            });
        });
        it("returns PHP's keyed result for a list given a key, which stays a list only for key 0", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "prepend-list-with-key"
            expect(Data.dataPrepend(["b", "c"], "a", 0)).toEqual(["a", "c"]);
            expect(Data.dataPrepend(["b", "c"], "a", "k")).toEqual({
                k: "a",
                0: "b",
                1: "c",
            });
            expect(Data.dataPrepend(["b", "c"], "a", 1)).toEqual({
                1: "a",
                0: "b",
            });
            expect(Data.dataPrepend(["b", "c"], "a", 1.5)).toEqual({
                1: "a",
                0: "b",
            });
        });

        it("keeps a sparse list backing's hole, as dataUnion already does (F-19)", () => {
            // JS-only: PHP has no array hole. `arr.union` fills one with `undefined`, so
            // a sparse backing must answer exactly like the dense list it stands for.
            const sparse = sparseList();
            expect(Data.dataPrepend(sparse, "z", 0)).toStrictEqual([
                "z",
                undefined,
                "c",
            ]);
            expect(Data.dataPrepend(sparse, "z", 0)).toStrictEqual(
                Data.dataPrepend(["a", undefined, "c"], "z", 0),
            );
            expect(Data.dataPrepend(sparse, "z", "k")).toStrictEqual({
                0: "a",
                1: undefined,
                2: "c",
                k: "z",
            });
            // The keyed backing has no hole to fill: a genuine gap stays a gap.
            expect(
                Data.dataPrepend({ 0: "a", 2: "c" }, "z", "k"),
            ).toStrictEqual({ 0: "a", 2: "c", k: "z" });
        });
    });

    describe("dataPull", () => {
        it("is object", () => {
            const result2 = Data.dataPull({ a: 1, b: 2 }, "b", "default");
            expect(result2.value).toBe(2);
            expect(result2.data).toEqual({ a: 1 });
        });
        it("is array", () => {
            const result1 = Data.dataPull([1, 2, 3], 1, "default");
            expect(result1.value).toBe(2);
            expect(result1.data).toEqual([1, 3]);
        });

        it("pulls a first-level key that contains dots, through the object backing", () => {
            // PHP-verified: docs/php-parity/task-09-paths.json, "Arr::pull
            // — first-level key containing dots".
            const result = Data.dataPull(
                { "joe@example.com": "Joe", "jane@localhost": "Jane" },
                "joe@example.com",
            );
            expect(result.value).toBe("Joe");
            expect(result.data).toEqual({ "jane@localhost": "Jane" });
        });
    });

    describe("dataQuery", () => {
        it("is object", () => {
            expect(Data.dataQuery({ name: "John", age: 30 })).toBe(
                "name=John&age=30",
            );
        });
        it("is array", () => {
            expect(Data.dataQuery([1, 2, 3])).toBe("0=1&1=2&2=3");
        });

        // Both backings must cast booleans like PHP's http_build_query: true -> "1",
        // false -> "0".
        it("casts booleans like PHP's http_build_query, either backing", () => {
            expect(Data.dataQuery({ foo: "bar", bar: true })).toBe(
                "foo=bar&bar=1",
            );
            expect(Data.dataQuery({ foo: "bar", bar: false })).toBe(
                "foo=bar&bar=0",
            );
            expect(Data.dataQuery([true, false])).toBe("0=1&1=0");
        });
    });

    describe("dataRandom", () => {
        it("is object", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Data.dataRandom(obj);
            // dataRandom with no count returns a single value
            expect([1, 2, 3]).toContain(result);
        });
        it("is array", () => {
            const arr = [1, 2, 3, 4, 5];
            const result = Data.dataRandom(arr);
            // dataRandom with no count returns a single value
            expect(arr).toContain(result);
        });

        // Arr.php:977 throws above the empty guard, and Arr.php:971 defaults
        // preserveKeys to false. Both backings agree.
        it("throws on an empty source and reindexes by default, either backing", () => {
            expect(() => Data.dataRandom([])).toThrow(
                "You requested 1 items, but there are only 0 items available.",
            );
            expect(() => Data.dataRandom({})).toThrow(
                "You requested 1 items, but there are only 0 items available.",
            );

            const fromArray = Data.dataRandom([10, 20, 30], 2) as unknown[];
            expect(Array.isArray(fromArray)).toBe(true);
            expect(Object.keys(fromArray)).toEqual(["0", "1"]);

            const fromObject = Data.dataRandom(
                { one: 10, two: 20, three: 30 },
                2,
            );
            expect(Object.keys(fromObject as Record<string, unknown>)).toEqual([
                "0",
                "1",
            ]);
        });
    });

    describe("dataSearch", () => {
        it("is object", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Data.dataSearch(obj, "2");
            expect(result).toBe("b");

            const result1 = Data.dataSearch(obj, "2", true);
            expect(result1).toBe(false);

            const result2 = Data.dataSearch(obj, 2, true);
            expect(result2).toBe("b");

            const result3 = Data.dataSearch(obj, (value) => value > 3);
            expect(result3).toBe(false);

            const result4 = Data.dataSearch(obj, (value) => value == 3);
            expect(result4).toBe("c");
        });
        it("is array", () => {
            const arr = [1, 2, 3, 4, 5];
            const result = Data.dataSearch(arr, "3");
            expect(result).toBe(2);

            const result1 = Data.dataSearch(arr, "3", true);
            expect(result1).toBe(false);

            const result2 = Data.dataSearch(arr, 3, true);
            expect(result2).toBe(2);

            const result3 = Data.dataSearch(arr, (value) => value > 5);
            expect(result3).toBe(false);

            const result4 = Data.dataSearch(arr, (value) => value == 4);
            expect(result4).toBe(3);
        });

        it("returns false when a callback never matches, instead of comparing against the callback", () => {
            // JS-only: Arr has no `search`; the defect is that a falsy callback result fell
            // through to `item == value`, comparing each item against the function object.
            expect(Data.dataSearch([1, 2, 3], () => false)).toBe(false);
            expect(Data.dataSearch({ a: 1, b: 2 }, () => false)).toBe(false);
        });

        it("keeps searching after a callback rejects an earlier item", () => {
            // JS-only: pins that the loop continues rather than short-circuiting on the first false.
            expect(Data.dataSearch([1, 2, 3], (item) => item === 3)).toBe(2);
            expect(Data.dataSearch({ a: 1, b: 2 }, (item) => item === 2)).toBe(
                "b",
            );
        });

        it("does not fall through to comparing a rejected item against the callback itself", () => {
            // JS-only: a reverted fix returns the callback's own key here, since `item == value`
            // matches by reference once `item` is the callback, instead of continuing the loop.
            const neverMatches = () => false;
            expect(Data.dataSearch([1, neverMatches, 3], neverMatches)).toBe(
                false,
            );
            expect(
                Data.dataSearch({ a: 1, b: neverMatches, c: 3 }, neverMatches),
            ).toBe(false);
        });

        it("distinguishes falsy values in strict mode", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "search-strict-falsy"
            const falsy = [false, 0, 1, [], ""];
            expect(Data.dataSearch(falsy, "false", true)).toBe(false);
            expect(Data.dataSearch(falsy, "1", true)).toBe(false);
            expect(Data.dataSearch(falsy, false, true)).toBe(0);
            expect(Data.dataSearch(falsy, 0, true)).toBe(1);
            expect(Data.dataSearch(falsy, 1, true)).toBe(2);
            expect(Data.dataSearch(falsy, "", true)).toBe(4);
            expect(Data.dataSearch(falsy, [], true)).toBe(3);
        });

        it("collapses falsy values in loose mode", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "search-loose-falsy"
            const falsy = [false, 0, 1, [], ""];
            expect(Data.dataSearch(falsy, 0)).toBe(0);
            expect(Data.dataSearch(falsy, "")).toBe(0);
            expect(Data.dataSearch(falsy, "1")).toBe(2);
        });

        it("matches an array or object needle by value, as PHP's === and == do", () => {
            // docs/php-parity/task-28-search-equality.json, "search-array-needle-strict",
            // "search-array-needle-loose", "search-keyed-needle-strict",
            // "search-keyed-needle-loose", "search-empty-array-needle-loose"
            expect(Data.dataSearch([[1, 2], [3]], [1, 2], true)).toBe(0);
            expect(Data.dataSearch([[1, 2], [3]], [1, 2])).toBe(0);
            expect(Data.dataSearch({ x: { a: 1 } }, { a: 1 }, true)).toBe("x");
            expect(Data.dataSearch({ x: { a: 1 } }, { a: 1 })).toBe("x");
            expect(Data.dataSearch([[]], [])).toBe(0);
        });

        it("keeps === key-order- and type-sensitive where == is neither", () => {
            // docs/php-parity/task-28-search-equality.json, "search-reordered-keys-strict",
            // "search-reordered-keys-loose", "search-numeric-string-element-strict",
            // "search-numeric-string-element-loose", "search-array-needle-wrong-order-strict"
            expect(Data.dataSearch([{ b: 2, a: 1 }], { a: 1, b: 2 }, true)).toBe(
                false,
            );
            expect(Data.dataSearch([{ b: 2, a: 1 }], { a: 1, b: 2 })).toBe(0);
            expect(Data.dataSearch([[1, 2]], [1, "2"], true)).toBe(false);
            expect(Data.dataSearch([[1, 2]], [1, "2"])).toBe(0);
            expect(Data.dataSearch([[1, 2]], [2, 1], true)).toBe(false);
            expect(Data.dataSearch({ k: [1, 2] }, [2, 1], true)).toBe(false);
        });

        it("takes PHP's loose casts, not JavaScript's, for a null needle", () => {
            // docs/php-parity/task-28-search-equality.json,
            // "search-null-needle-on-zero-loose", "search-null-needle-on-zero-strict"
            expect(Data.dataSearch([0], null)).toBe(0);
            expect(Data.dataSearch({ a: 0 }, null)).toBe("a");
            expect(Data.dataSearch([0], null, true)).toBe(false);
            expect(Data.dataSearch({ a: 0 }, null, true)).toBe(false);
        });

        it("returns the string key of a hit on the object backing", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "search-string-key-hit"
            expect(Data.dataSearch({ foo: "bar", baz: "qux" }, "qux")).toBe(
                "baz",
            );
        });

        it("returns a number for a numeric-string key on the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "chunkBy-noncanonical-key-type":
            // `phpArrayKey` converts a canonical integer string and leaves "01" a string, as PHP
            // stores it. The list backing can only carry canonical indices, so it always answers a number.
            expect(Data.dataSearch({ "10": "x", foo: "y" }, "x")).toBe(10);
            expect(Data.dataSearch({ "10": "x", foo: "y" }, "y")).toBe("foo");
            expect(Data.dataSearch({ "01": "x", foo: "y" }, "x")).toBe("01");
            expect(Data.dataSearch(["x", "y"], "y")).toBe(1);
        });

        it("returns false when nothing matches, by value or by callback", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "search-not-found", "search-callback-not-found"
            expect(Data.dataSearch([1, 2, 3], 9)).toBe(false);
            expect(Data.dataSearch({ a: 1 }, 9)).toBe(false);
            expect(Data.dataSearch([1, 2, 3], (value) => value > 9)).toBe(
                false,
            );
        });

        it("passes the key to the callback", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "search-callback-key-arg", "search-assoc-callback-key-arg"
            expect(
                Data.dataSearch(["a", "b", "c"], (_value, key) => key === 2),
            ).toBe(2);
            expect(
                Data.dataSearch({ x: 1, y: 2 }, (_value, key) => key === "y"),
            ).toBe("y");
        });
    });

    describe("dataBefore", () => {
        it("is object", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Data.dataBefore(obj, "2");
            expect(result).toBe(1);

            const result1 = Data.dataBefore(obj, "2", true);
            expect(result1).toBeNull();

            const result2 = Data.dataBefore(obj, 2, true);
            expect(result2).toBe(1);

            const result3 = Data.dataBefore(obj, (value) => value > 3);
            expect(result3).toBeNull();

            const result4 = Data.dataBefore(obj, (value) => value === 3);
            expect(result4).toBe(2);

            // When searching for the first element, there is no "before"
            const result5 = Data.dataBefore(obj, 1, true);
            expect(result5).toBeNull();
        });
        it("is array", () => {
            const arr = [1, 2, 3, 4, 5];
            const result = Data.dataBefore(arr, "3");
            expect(result).toBe(2);

            const result1 = Data.dataBefore(arr, "3", true);
            expect(result1).toBeNull();

            const result2 = Data.dataBefore(arr, 3, true);
            expect(result2).toBe(2);

            const result3 = Data.dataBefore(arr, (value) => value > 5);
            expect(result3).toBeNull();

            const result4 = Data.dataBefore(arr, (value) => value === 4);
            expect(result4).toBe(3);

            // When searching for the first element, there is no "before"
            const result5 = Data.dataBefore(arr, 1, true);
            expect(result5).toBeNull();
        });

        it("finds the item before a falsy value in strict mode", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "before-strict-falsy"
            const falsy = [false, 0, 1, [], ""];
            expect(Data.dataBefore(falsy, 1, true)).toBe(0);
            // The first element has nothing before it.
            expect(Data.dataBefore(falsy, false, true)).toBeNull();
        });

        it("finds the item before an array or object needle matched by value", () => {
            // docs/php-parity/task-28-search-equality.json, "before-array-needle",
            // "before-keyed-needle" — before() calls search(), so it inherits its rule.
            expect(Data.dataBefore([[0], [1, 2]], [1, 2])).toEqual([0]);
            expect(
                Data.dataBefore({ a: { k: 0 }, b: { k: 1 } }, { k: 1 }),
            ).toEqual({ k: 0 });
        });
    });

    describe("dataAfter", () => {
        it("is object", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Data.dataAfter(obj, "2");
            expect(result).toBe(3);

            const result1 = Data.dataAfter(obj, "2", true);
            expect(result1).toBeNull();

            const result2 = Data.dataAfter(obj, 2, true);
            expect(result2).toBe(3);

            const result3 = Data.dataAfter(obj, (value) => value < 1);
            expect(result3).toBeNull();

            const result4 = Data.dataAfter(obj, (value) => value === 1);
            expect(result4).toBe(2);

            // When searching for the last element, there is no "after"
            const result5 = Data.dataAfter(obj, 3, true);
            expect(result5).toBeNull();
        });
        it("is array", () => {
            const arr = [1, 2, 3, 4, 5];
            const result = Data.dataAfter(arr, "3");
            expect(result).toBe(4);

            const result1 = Data.dataAfter(arr, "3", true);
            expect(result1).toBeNull();

            const result2 = Data.dataAfter(arr, 3, true);
            expect(result2).toBe(4);

            const result3 = Data.dataAfter(arr, (value) => value < 1);
            expect(result3).toBeNull();

            const result4 = Data.dataAfter(arr, (value) => value === 4);
            expect(result4).toBe(5);

            // When searching for the last element, there is no "after"
            const result5 = Data.dataAfter(arr, 5, true);
            expect(result5).toBeNull();
        });

        it("finds the item after a falsy value in strict mode", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "after-strict-falsy"
            const falsy = [false, 0, 1, [], ""];
            expect(Data.dataAfter(falsy, 0, true)).toBe(1);
            // The last element has nothing after it.
            expect(Data.dataAfter(falsy, "", true)).toBeNull();
        });

        it("finds the item after an array or object needle matched by value", () => {
            // docs/php-parity/task-28-search-equality.json, "after-array-needle",
            // "after-keyed-needle" — after() calls search(), so it inherits its rule.
            expect(Data.dataAfter([[1, 2], [9]], [1, 2])).toEqual([9]);
            expect(
                Data.dataAfter({ a: { k: 0 }, b: { k: 1 } }, { k: 0 }),
            ).toEqual({ k: 1 });
        });
    });

    describe("dataShift", () => {
        it("renumbers a negative integer key through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "shift-negative-int-keys"
            const data = { x: "a", "-1": "b", y: "c" };

            expect(Data.dataShift(data)).toBe("a");
            expect(data).toEqual({ 0: "b", y: "c" });
        });
        it("is object", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Data.dataShift(obj);
            expect(result).toBe(1);
            expect(obj).toEqual({ b: 2, c: 3 });
        });
        it("is array", () => {
            const arr = [1, 2, 3, 4, 5];
            const result = Data.dataShift(arr);
            expect(result).toBe(1);
            expect(arr).toEqual([2, 3, 4, 5]);
        });
        it("throws when the shift count is negative, for either backing", () => {
            expect(() => Data.dataShift([1], -1)).toThrow(
                "Number of shifted items may not be less than zero.",
            );
            expect(() => Data.dataShift({ a: 1 }, -1)).toThrow(
                "Number of shifted items may not be less than zero.",
            );
        });
        it("returns null when shifting an empty source, for any count and either backing", () => {
            expect(Data.dataShift([], 3)).toBeNull();
            expect(Data.dataShift({}, 3)).toBeNull();
        });
    });

    describe("dataSet", () => {
        it("is object", () => {
            const result = Data.dataSet({ a: 1, b: 2 }, "c", 3);
            expect(result).toEqual({
                a: 1,
                b: 2,
                c: 3,
            });
        });
        it("is array", () => {
            const result = Data.dataSet([1, 2, 3], 1, 99);
            expect(result).toEqual([1, 99, 3]);
        });

        it("replaces a nested class instance on both backings", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "r3-set-list-nested-object-is-replaced-wholesale" and its keyed twin "d6-set-assoc-…".
            // The list backing used to merge, answering {x: 1, y: 2}.
            const listItem = new D4Point();
            const recordItem = new D4Point();

            expect(Data.dataSet([listItem], "0.y", 2)).toEqual([{ y: 2 }]);
            expect(Data.dataSet({ a: recordItem }, "a.y", 2)).toEqual({
                a: { y: 2 },
            });
            expect(Object.entries(listItem)).toEqual([["x", 1]]);
            expect(Object.entries(recordItem)).toEqual([["x", 1]]);
        });

        it("descends into a nested list on both backings", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "r4-set-nested-list-in-a-list-is-descended" ([['q']], '0.1') and
            // "d6-nested-list-is-descended-not-replaced", "set" (['a' => ['q']], 'a.1').
            const listInner = ["q"];
            const recordInner = ["q"];
            const fromList = Data.dataSet([listInner], "0.1", "y");
            const fromRecord = Data.dataSet({ a: recordInner }, "a.1", "y");

            expect(fromList).toEqual([["q", "y"]]);
            expect(fromRecord).toEqual({ a: ["q", "y"] });
            // Only pop, shift, splice and unshift mutate, so neither inner list is written.
            // Read through Object.values: the declared write result is no array type.
            expect(Object.values(fromList)[0]).not.toBe(listInner);
            expect(Object.values(fromRecord)[0]).not.toBe(recordInner);
            expect(listInner).toEqual(["q"]);
            expect(recordInner).toEqual(["q"]);
        });

        // docs/php-parity/task-17-second-review.json: "Arr::set writes a
        // \"constructor\" key", "...a \"prototype\" key", "...a \"__proto__\" key"
        describe("unsafe-key write policy", () => {
            afterEach(() => {
                expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
                expect(Object.getPrototypeOf({})).toBe(Object.prototype);
            });

            it.each(["constructor", "prototype", "__proto__"])(
                "keeps a %s key as own data",
                (key) => {
                    expect(
                        Object.hasOwn(Data.dataSet({}, key, 5) as object, key),
                    ).toBe(true);
                },
            );

            // docs/php-parity/task-17-second-review.json, "Arr::set writes a nested \"constructor.prototype\" path"
            it("builds a nested constructor.prototype path without polluting", () => {
                const result = Data.dataSet(
                    {},
                    "constructor.prototype.polluted",
                    5,
                ) as Record<string, unknown>;
                expect(result).toEqual({
                    constructor: { prototype: { polluted: 5 } },
                });
            });

            // The 4 hostile paths from the Task 0 audit: neither the accessor
            // (__proto__) nor the ordinary data properties (constructor,
            // prototype) reach a global prototype through Arr.set or dataSet.
            it("cannot pollute a global prototype through any write path", () => {
                for (const path of [
                    "__proto__.PWN",
                    "constructor.prototype.PWN",
                    "0.__proto__.PWN",
                    "0.constructor.prototype.PWN",
                ]) {
                    Arr.set([{}], path, 1);
                    Data.dataSet({}, path, 1);
                }
                expect(({} as { PWN?: unknown }).PWN).toBeUndefined();
                expect(
                    ([] as unknown as { PWN?: unknown }).PWN,
                ).toBeUndefined();
                expect(
                    (function () {} as unknown as { PWN?: unknown }).PWN,
                ).toBeUndefined();
            });

            // A pre-existing own key aliasing a global, not a fresh container,
            // is the only fixture exposing this. Arr.add exercises it (Arr.set's
            // own deep copy happens to flatten the alias first).
            it("cannot pollute a global prototype when an own key aliases one", () => {
                const aliasing = (target: object): Record<string, unknown> => {
                    const a = Object.create(null) as Record<string, unknown>;
                    a["__proto__"] = target;
                    return a;
                };

                for (const target of [Object.prototype, Array.prototype]) {
                    for (const path of [
                        "__proto__.PWN",
                        "constructor.prototype.PWN",
                        "0.__proto__.PWN",
                        "0.constructor.prototype.PWN",
                    ]) {
                        Arr.set([aliasing(target)], path, 1);
                        Arr.add([aliasing(target)], path, 1);
                    }
                    Data.dataSet(aliasing(target), "__proto__.PWN", 1);
                    Data.dataSet(
                        aliasing(target),
                        "constructor.prototype.PWN",
                        1,
                    );
                }

                expect(({} as { PWN?: unknown }).PWN).toBeUndefined();
                expect(
                    ([] as unknown as { PWN?: unknown }).PWN,
                ).toBeUndefined();
                expect(
                    (function () {} as unknown as { PWN?: unknown }).PWN,
                ).toBeUndefined();
            });
        });
    });

    describe("dataPush", () => {
        it("is object", () => {
            const obj = { items: ["a", "b"] };
            const result = Data.dataPush(obj, "items", "c", "d");
            expect(result).toEqual({ items: ["a", "b", "c", "d"] });
        });
        it("appends with the next integer key when the key is null", () => {
            // docs/php-parity/task-17-second-review.json, "Arr::push with a null key appends"
            expect(Data.dataPush({ a: 1 }, null, 9)).toEqual({ a: 1, 0: 9 });
        });
        it("is array", () => {
            // PHP-verified in docs/php-parity/task-16-final-review.json ("push appends
            // into the array AT the key, never beside it").
            const result = Data.dataPush(
                [
                    ["a", "b"],
                    ["c", "d"],
                ],
                1,
                ["x", "y"],
            );
            expect(result).toEqual([
                ["a", "b"],
                ["c", "d", ["x", "y"]],
            ]);
        });

        it("leaves the caller's nested value alone on a list backing", () => {
            // JS-only: PHP pushes through the reference and mutates
            // (task-24-data-release-readiness.json, "push-integer-key-mutates-the-caller-
            // by-reference"); this port's settled contract keeps push non-mutating.
            const inner = ["x"];
            const result = Data.dataPush([inner], 0, "y");

            expect(result).toEqual([["x", "y"]]);
            expect(inner).toEqual(["x"]);
            expect(result[0]).not.toBe(inner);
        });

        it("leaves the caller's nested value alone on a record backing", () => {
            // JS-only: the record half of the case above, which answers the same way.
            const inner = ["x"];
            const result = Data.dataPush({ 0: inner }, 0, "y");

            expect(result).toEqual({ 0: ["x", "y"] });
            expect(inner).toEqual(["x"]);
            expect(result[0]).not.toBe(inner);
        });
    });

    describe("dataUnshift", () => {
        it("is object", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "D1b unshift two assoc items onto assoc"
            const source = { b: 2 };
            const result = Data.dataUnshift(source, { a: 1 }, { d: "house" });
            expect(result).toEqual({
                0: { a: 1 },
                1: { d: "house" },
                b: 2,
            });
            expect(source).toEqual({ 0: { a: 1 }, 1: { d: "house" }, b: 2 });
        });
        it("prepends an object item as one element, like array_unshift", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "D1 unshift assoc item onto assoc"
            expect(Data.dataUnshift({ b: 2 }, { a: 1 })).toEqual({
                0: { a: 1 },
                b: 2,
            });
        });
        it("renumbers a negative integer key through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "unshift-negative-int-key"
            expect(Data.dataUnshift({ "-1": "a", x: "b" }, "z")).toEqual({
                0: "z",
                1: "a",
                x: "b",
            });
        });
        it("mutates the source array in place, like array_unshift", () => {
            const data = [2];
            Data.dataUnshift(data, 1);
            expect(data).toEqual([1, 2]);
        });
        it("is array", () => {
            const expected = [
                "Jonny from Laroe",
                ["Jonny", "from", "Laroe"],
                ["a", "b", "c"],
                4,
                5,
                6,
            ];

            const data = [4, 5, 6];

            let result: unknown[] = Data.dataUnshift(data, ["a", "b", "c"]);
            result = Data.dataUnshift(result, ["Jonny", "from", "Laroe"]);
            result = Data.dataUnshift(result, "Jonny from Laroe");
            expect(result).toEqual(expected);
        });
        it("keeps an undefined item on both backings", () => {
            // JS-only: undefined has no PHP analogue. arr.unshift used to drop it while
            // obj.unshift kept it, so the two backings answered differently.
            // Compared by element identity: an undefined element is not a missing one.
            const list = Data.dataUnshift(["a"], undefined, "b");
            const record = Data.dataUnshift({ x: "a" }, undefined, "b");

            expect(list).toHaveLength(3);
            expect(list[0]).toBeUndefined();
            expect(list[1]).toBe("b");

            expect(Object.keys(record)).toEqual(["0", "1", "x"]);
            expect(record[0]).toBeUndefined();
            expect(record[1]).toBe("b");
        });
    });

    describe("dataShuffle", () => {
        it("is object", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "shuffle-assoc-keys", "shuffle-assoc-values-sorted"
            const result = Data.dataShuffle({ a: 1, b: 2, c: 3, d: 4, e: 5 });

            expect(Object.values(result).sort()).toEqual([1, 2, 3, 4, 5]);
            expect(Object.keys(result)).toEqual(["0", "1", "2", "3", "4"]);
        });
        it("is array", () => {
            const result = Data.dataShuffle([1, 2, 3, 4]);
            expect(result).toHaveLength(4);
            expect(result).toEqual(expect.arrayContaining([1, 2, 3, 4]));
        });

        it("returns an empty result for an empty backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "shuffle-empty"
            expect(Data.dataShuffle([])).toEqual([]);
            expect(Data.dataShuffle({})).toEqual({});
        });

        it("keeps exactly the same values, through the list backing", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "shuffle-keeps-same-values"
            const source = [...Array(26).keys()];
            const shuffled = Data.dataShuffle(source) as number[];
            expect([...shuffled].sort((a, b) => a - b)).toEqual(source);
            expect(Object.keys(shuffled)).toEqual(source.map(String));
        });
    });

    describe("dataSlice", () => {
        it("is object", () => {
            const result = Data.dataSlice(
                { a: 1, b: 2, c: 3, d: 4, e: 5 },
                1,
                -1,
            );
            expect(result).toEqual({ b: 2, c: 3, d: 4 });

            // Test with default length (null) - not explicitly passed
            expect(Data.dataSlice({ a: 1, b: 2, c: 3 }, 1)).toEqual({
                b: 2,
                c: 3,
            });
        });
        it("is array", () => {
            const result = Data.dataSlice([1, 2, 3, 4, 5, 6, 7, 8], 1, -1);
            expect(result).toEqual([2, 3, 4, 5, 6, 7]);

            // Test with default length (null) - not explicitly passed
            expect(Data.dataSlice([1, 2, 3, 4, 5], 2)).toEqual([3, 4, 5]);
        });

        // A negative offset combined with a length beyond the remaining tail used to
        // return an empty result instead of the last N items — PHP-verified
        // (docs/php-parity/task-04-shared.json, "slice(-2,5) preserve_keys").
        it("slices from the end for a negative offset with a length — both shapes agree", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8];
            const obj = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 };

            expect(Data.dataSlice(arr, -2, 5)).toEqual([7, 8]);
            expect(Data.dataSlice(obj, -2, 5)).toEqual({ g: 7, h: 8 });

            // The arr/obj layers also pin slice(-2,2) — PHP-verified
            // (docs/php-parity/task-04-shared.json, "slice(-2,2) preserve_keys") — add
            // it here too, both shapes.
            expect(Data.dataSlice(arr, -2, 2)).toEqual([7, 8]);
            expect(Data.dataSlice(obj, -2, 2)).toEqual({ g: 7, h: 8 });
        });

        // The arr/obj layers pin a zero length — PHP-verified
        // (docs/php-parity/task-04-shared.json, "slice(1,0)"):
        // array_slice(['a'=>1,'b'=>2,'c'=>3], 1, 0, true) -> []. Both shapes.
        it("returns an empty result for a zero length — both shapes agree", () => {
            expect(Data.dataSlice([1, 2, 3], 1, 0)).toEqual([]);
            expect(Data.dataSlice({ a: 1, b: 2, c: 3 }, 1, 0)).toEqual({});
        });
    });

    describe("dataSole", () => {
        it("is object", () => {
            const obj = { only: 42 };
            const result = Data.dataSole(obj);
            expect(result).toBe(42);
        });
        it("is array", () => {
            const result = Data.dataSole([42]);
            expect(result).toBe(42);
        });

        it("finds the one item a callback matches", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "sole-rows-callback"
            expect(
                Data.dataSole(
                    { a: { name: "foo" }, b: { name: "bar" } },
                    (value) => value.name === "foo",
                ),
            ).toEqual({ name: "foo" });
        });

        it("throws when nothing matches, on either backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "sole-none"
            // docs/php-parity/task-24-data-release-readiness.json, "sole-empty-no-callback"
            expect(() =>
                Data.dataSole({ a: "foo" }, (value) => value === "baz"),
            ).toThrow(ItemNotFoundException);
            expect(() => Data.dataSole([])).toThrow(ItemNotFoundException);
            expect(() => Data.dataSole({})).toThrow(ItemNotFoundException);
        });

        it("throws when more than one item matches, reporting the count", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "sole-multi-list", "sole-assoc-multi-callback"
            // docs/php-parity/task-24-data-release-readiness.json, "sole-multi-no-callback"
            expect(() =>
                Data.dataSole(
                    ["baz", "foo", "baz"],
                    (value) => value === "baz",
                ),
            ).toThrow(MultipleItemsFoundException);
            expect(() =>
                Data.dataSole(
                    ["baz", "foo", "baz"],
                    (value) => value === "baz",
                ),
            ).toThrow("2 items were found.");
            expect(() =>
                Data.dataSole(
                    { a: "baz", b: "foo", c: "baz" },
                    (value) => value === "baz",
                ),
            ).toThrow("2 items were found.");
            expect(() => Data.dataSole({ a: 1, b: 2 })).toThrow(
                "2 items were found.",
            );
        });
    });

    describe("dataSort", () => {
        it("is object", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "sort-scalar-keys"
            const obj = { c: 3, a: 1, b: 2 };
            const result = Data.dataSort(obj);
            expect(result).toEqual({ a: 1, b: 2, c: 3 });
            // toEqual ignores key order, so pin the order Arr::sort guarantees.
            expect(Object.keys(result)).toEqual(["a", "b", "c"]);
        });
        it("is array", () => {
            const arr = [3, 1, 2];
            const result = Data.dataSort(arr);
            expect(result).toEqual([1, 2, 3]);
        });

        it("sorts rows with a closure selector and a dot-notation key, keeping the keys", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "sort-rows-natural", "sort-rows-natural-keys"
            const natural = Data.dataSort({
                a: { name: "Desk" },
                b: { name: "Chair" },
            });
            expect(Object.keys(natural)).toEqual(["b", "a"]);

            // docs/php-parity/task-24-data-release-readiness.json, "sort-rows-closure-keys"
            const byClosure = Data.dataSort(
                { a: { name: "Desk" }, b: { name: "Chair" } },
                (value) => value.name,
            );
            expect(Object.keys(byClosure)).toEqual(["b", "a"]);

            // docs/php-parity/task-24-data-release-readiness.json, "sort-rows-dot-key-keys"
            const byDotKey = Data.dataSort(
                { a: { meta: { k: 2 } }, b: { meta: { k: 1 } } },
                "meta.k",
            );
            expect(Object.keys(byDotKey)).toEqual(["b", "a"]);

            // docs/php-parity/task-24-data-release-readiness.json, "sort-rows-list-closure"
            expect(
                Data.dataSort(
                    [{ name: "Desk" }, { name: "Chair" }],
                    (value) => value.name,
                ),
            ).toEqual([{ name: "Chair" }, { name: "Desk" }]);
        });

        it("sorts by several keys, falling through on a tie", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "sortByMany-keys", "sortByMany-keys-order"
            const rows = {
                a: { name: "John", age: 8, meta: { key: 3 } },
                b: { name: "John", age: 10, meta: { key: 5 } },
                c: { name: "Dave", age: 10, meta: { key: 3 } },
                d: { name: "John", age: 8, meta: { key: 2 } },
            };
            expect(
                Object.keys(Data.dataSort(rows, ["name", "age", "meta.key"])),
            ).toEqual(["c", "d", "a", "b"]);

            // docs/php-parity/task-24-data-release-readiness.json, "sortByMany-keys-list"
            const rowsList = [rows.a, rows.b, rows.c, rows.d];
            expect(
                Data.dataSort(rowsList, ["name", "age", "meta.key"]),
            ).toEqual([rows.c, rows.d, rows.a, rows.b]);
        });

        it("honours a per-key direction descriptor", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "sortByMany-order"
            const rows = {
                a: { name: "John", age: 8, meta: { key: 3 } },
                b: { name: "John", age: 10, meta: { key: 5 } },
                c: { name: "Dave", age: 10, meta: { key: 3 } },
                d: { name: "John", age: 8, meta: { key: 2 } },
            };
            expect(
                Object.keys(
                    Data.dataSort(rows, [
                        "name",
                        ["age", false],
                        ["meta.key", true],
                    ]),
                ),
            ).toEqual(["c", "b", "d", "a"]);

            // docs/php-parity/task-24-data-release-readiness.json, "sortByMany-order-list"
            const rowsList = [rows.a, rows.b, rows.c, rows.d];
            expect(
                Data.dataSort(rowsList, [
                    "name",
                    ["age", false],
                    ["meta.key", true],
                ]),
            ).toEqual([rows.c, rows.b, rows.d, rows.a]);
        });
    });

    describe("dataSortDesc", () => {
        it("is object", () => {
            const obj = { c: 3, a: 1, b: 2 };
            const result = Data.dataSortDesc(obj);
            expect(result).toEqual({ c: 3, b: 2, a: 1 });
        });
        it("is array", () => {
            const arr = [3, 1, 2];
            const result = Data.dataSortDesc(arr);
            expect(result).toEqual([3, 2, 1]);
        });

        it("sorts rows descending with a closure selector and a dot-notation key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "sortDesc-rows-natural", "sortDesc-rows-natural-keys"
            const result = Data.dataSortDesc({
                a: { name: "Chair" },
                b: { name: "Desk" },
            });
            expect(Object.keys(result)).toEqual(["b", "a"]);
            expect(result).toEqual({
                b: { name: "Desk" },
                a: { name: "Chair" },
            });

            // docs/php-parity/task-24-data-release-readiness.json, "sortDesc-rows-list-dot-key"
            expect(
                Data.dataSortDesc(
                    [{ meta: { k: 1 } }, { meta: { k: 2 } }],
                    "meta.k",
                ),
            ).toEqual([{ meta: { k: 2 } }, { meta: { k: 1 } }]);
        });

        it("pins the descending key order on the object backing", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "sortDesc-scalar-keys"
            expect(
                Object.keys(Data.dataSortDesc({ c: 3, a: 1, b: 2 })),
            ).toEqual(["c", "b", "a"]);
        });
    });

    describe("data sort recursive", () => {
        const obj = {
            b: { d: 2, c: 1, z: 50, y: 55, x: 50 },
            a: { f: 4, e: 3, x: 100, y: 100 },
        };

        const arr = [
            {
                b: [3, 1, 2],
                a: { d: 2, c: 1 },
            },
        ];

        describe("dataSortRecursive", () => {
            it("is object", () => {
                const result = Data.dataSortRecursive(obj);
                expect(Object.keys(result)).toEqual(["a", "b"]);
                expect(Object.keys(result["a"])).toEqual(["e", "f", "x", "y"]);
                expect(Object.keys(result["b"])).toEqual([
                    "c",
                    "d",
                    "x",
                    "y",
                    "z",
                ]);
            });
            it("is array", () => {
                const result = Data.dataSortRecursive(arr);
                expect(result).toEqual([
                    {
                        a: { c: 1, d: 2 },
                        b: [1, 2, 3],
                    },
                ]);
            });

            it("orders numbers numerically inside a nested list, through the object backing", () => {
                // docs/php-parity/task-23-obj-release-readiness.json, "sortRecursive-numbers-lexical"
                expect(Data.dataSortRecursive({ a: [10, 9, 1] })).toEqual({
                    a: [1, 9, 10],
                });
            });

            it("keeps a Date value whole, through the object backing", () => {
                // docs/php-parity/task-23-obj-release-readiness.json, "sortRecursive-object-leaf"
                const date = new Date(0);
                const sorted = Data.dataSortRecursive({ d: date, a: 1 });
                expect(Object.keys(sorted)).toEqual(["a", "d"]);
                expect(sorted["d"]).toBe(date);
            });

            it("keeps a Date inside a nested list whole, through the list backing", () => {
                // docs/php-parity/task-23-obj-release-readiness.json, "sortRecursive-list-object-leaf"
                const date = new Date(0);
                expect(Data.dataSortRecursive([[date]])[0]?.[0]).toBe(date);
            });
        });

        describe("dataSortRecursiveDesc", () => {
            it("is object", () => {
                const result = Data.dataSortRecursiveDesc(obj);
                expect(Object.keys(result)).toEqual(["b", "a"]);
                expect(Object.keys(result["a"])).toEqual(["y", "x", "f", "e"]);
                expect(Object.keys(result["b"])).toEqual([
                    "z",
                    "y",
                    "x",
                    "d",
                    "c",
                ]);
            });
            it("is array", () => {
                const result = Data.dataSortRecursiveDesc(arr);
                expect(result).toEqual([
                    {
                        b: [3, 2, 1],
                        a: { d: 2, c: 1 },
                    },
                ]);
            });

            it("orders nested numbers descending, numerically", () => {
                // docs/php-parity/task-23-obj-release-readiness.json, "sortRecursiveDesc-numbers"
                expect(Data.dataSortRecursiveDesc({ a: [1, 9, 10] })).toEqual({
                    a: [10, 9, 1],
                });
                // docs/php-parity/task-24-data-release-readiness.json,
                // "sortRecursiveDesc-numbers-list"
                expect(Data.dataSortRecursiveDesc([[1, 9, 10]])).toEqual([
                    [10, 9, 1],
                ]);
            });

            it("descends every level of the ArrTest fixture", () => {
                // docs/php-parity/task-24-data-release-readiness.json,
                // "sortRecursiveDesc-three-groups"
                const result = Data.dataSortRecursiveDesc({
                    empty: {},
                    nested: {
                        level1: {
                            level2: { level3: [2, 3, 1] },
                            values: [4, 5, 6],
                        },
                    },
                    mixed: { a: 1, 2: "b", c: 3, 1: "d" },
                });
                expect(Object.keys(result)).toEqual([
                    "nested",
                    "mixed",
                    "empty",
                ]);
                // toEqual alone doesn't pin level1's own key order (values vs level2).
                expect(Object.keys(result["nested"].level1)).toEqual([
                    "values",
                    "level2",
                ]);
                expect(result["nested"]).toEqual({
                    level1: {
                        values: [6, 5, 4],
                        level2: { level3: [3, 2, 1] },
                    },
                });
                // JS-only: PHP orders `mixed` as {"c":3,"a":1,"2":"b","1":"d"}; a JS object
                // hoists integer-like keys ahead of string keys regardless of insertion order,
                // so only the relative order WITHIN each key class can be pinned here.
                expect(Object.keys(result["mixed"])).toEqual([
                    "1",
                    "2",
                    "c",
                    "a",
                ]);
            });
        });
    });

    describe("dataSplice", () => {
        it("renumbers negative integer keys through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "splice-negative-int-keys"
            const data = { x: "a", "-3": "b", "-7": "c" };

            expect(Data.dataSplice(data, 0, 3)).toEqual({
                x: "a",
                0: "b",
                1: "c",
            });
        });
        it("is object", () => {
            // An object-backed source stays object-backed and keeps its keys on the
            // removed portion; the replacement's own keys are discarded and renumbered
            // from 0 (array_splice), which then sorts first — JS integer-key ordering.
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            const result = Data.dataSplice(obj, 1, 2, {
                x: 99,
                y: 100,
            });
            expect(Array.isArray(obj)).toBe(false);
            expect(result).toEqual({ b: 2, c: 3 });
            expect(obj).toEqual({ "0": 99, "1": 100, a: 1, d: 4 });
        });
        it("is array", () => {
            const arr = [1, 2, 3, 4];
            const result = Data.dataSplice(arr, 1, 2, [99, 100]);
            expect(result).toEqual([2, 3]);
            expect(arr).toEqual([1, 99, 100, 4]);
        });
        it("removes through to the end when no length is given, for either backing", () => {
            // The one-arg form removes offset -> end, not nothing.
            const obj = { foo: "f", baz: "z" };
            expect(Data.dataSplice(obj, 1)).toEqual({ baz: "z" });
            expect(obj).toEqual({ foo: "f" });

            const arr = ["foo", "baz"];
            expect(Data.dataSplice(arr, 1)).toEqual(["baz"]);
            expect(arr).toEqual(["foo"]);
        });
    });

    describe("dataString", () => {
        it("is object", () => {
            expect(Data.dataString({ name: "John" }, "name", "")).toBe("John");
            expect(Data.dataString({}, "missing", "default")).toBe("default");

            expect(Data.dataString({ name: "Jane" }, "name")).toBe("Jane");
        });

        it("is array", () => {
            expect(Data.dataString(["hello", "world"], 0, "")).toBe("hello");
            expect(Data.dataString([], 0, "default")).toBe("default");

            expect(Data.dataString(["foo", "bar"], 1)).toBe("bar");
        });

        it("throws when the value is not a string, naming the backing in the message", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "string-int-value" and
            // task-24-data-release-readiness.json, "string-list-int-key". JS-only: @tolki/obj
            // reports "Object value for key [...]"; PHP has only the array prefix.
            expect(() => Data.dataString({ integer: 1234 }, "integer")).toThrow(
                "Object value for key [integer] must be a string, integer found.",
            );
            expect(() => Data.dataString([1234], 0)).toThrow(
                "Array value for key [0] must be a string, integer found.",
            );
        });

        it("throws for a missing key when no default is given", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "string-missing-key-no-default", "string-list-missing-index-no-default"
            // JS-only: the object backing says "Object value for key [...]"; PHP has only the array prefix.
            expect(() => Data.dataString({}, "missing")).toThrow(
                "Object value for key [missing] must be a string, NULL found.",
            );
            expect(() => Data.dataString([], 0)).toThrow(
                "Array value for key [0] must be a string, NULL found.",
            );
        });
    });

    describe("dataToCssClasses", () => {
        it("is object", () => {
            expect(
                Data.dataToCssClasses({
                    btn: true,
                    "btn-primary": true,
                    disabled: false,
                }),
            ).toBe("btn btn-primary");
        });
        it("is array", () => {
            expect(Data.dataToCssClasses(["btn", "btn-primary"])).toBe(
                "btn btn-primary",
            );
        });

        // Arr.php:1214, is_numeric($class) pushes the VALUE. Both backings must agree,
        // per the unison rule.
        it("emits the value for numeric keys, either backing", () => {
            expect(
                Data.dataToCssClasses({
                    0: "font-bold",
                    1: "mt-4",
                    "ml-2": true,
                    "mr-2": false,
                }),
            ).toBe("font-bold mt-4 ml-2");
            expect(Data.dataToCssClasses(["font-bold", "mt-4", "ml-2"])).toBe(
                "font-bold mt-4 ml-2",
            );
        });
    });

    describe("dataToCssStyles", () => {
        it("is object", () => {
            expect(
                Data.dataToCssStyles({
                    "font-weight: bold": true,
                    "color: red": false,
                    "margin-top: 4px": true,
                }),
            ).toBe("font-weight: bold; margin-top: 4px;");
        });
        it("is array", () => {
            expect(
                Data.dataToCssStyles(["font-weight: bold", "margin-top: 4px"]),
            ).toBe("font-weight: bold; margin-top: 4px;");
        });

        // Arr.php:1237, is_numeric($class) pushes the VALUE, finished with a semicolon.
        // Both backings must agree, per the unison rule.
        it("emits the value for numeric keys, either backing", () => {
            expect(
                Data.dataToCssStyles({
                    0: "font-weight: bold",
                    "margin-left: 2px;": true,
                }),
            ).toBe("font-weight: bold; margin-left: 2px;");
            expect(
                Data.dataToCssStyles(["font-weight: bold", "margin-left: 2px"]),
            ).toBe("font-weight: bold; margin-left: 2px;");
        });
    });

    describe("dataWhere", () => {
        it("is object", () => {
            expect(
                Data.dataWhere({ a: 1, b: 2, c: 3 }, (value) => value > 1),
            ).toEqual({ b: 2, c: 3 });
        });
        it("is array", () => {
            expect(Data.dataWhere([1, 2, 3, 4], (value) => value > 2)).toEqual([
                3, 4,
            ]);
        });

        it("preserves the original keys, through the object backing", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "where-preserves-int-keys"
            // JS-only: the list backing renumbers (a JS array cannot hold sparse integer
            // keys), so the PHP key shape [1=>'200', 3=>'400'] is asserted on the object.
            expect(
                Data.dataWhere(
                    { 0: "100", 1: "200", 2: "300", 3: "400" },
                    (value) => value === "200" || value === "400",
                ),
            ).toEqual({ 1: "200", 3: "400" });
            expect(Data.dataWhere([1, 2, 3, 4], (value) => value > 2)).toEqual([
                3, 4,
            ]);
        });

        it("passes the key to the callback", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "whereKey-numeric"
            expect(
                Data.dataWhere(
                    { 10: 1, foo: 3, 20: 2 },
                    (_value, key) => typeof key === "number",
                ),
            ).toEqual({ 10: 1, 20: 2 });
            // docs/php-parity/task-24-data-release-readiness.json, "where-list-key-predicate"
            expect(
                Data.dataWhere(["a", "b", "c"], (_value, key) => key > 0),
            ).toEqual(["b", "c"]);
        });
    });

    describe("dataReplace", () => {
        it("returns the keyed result when a replacer leaves a list backing's keys other than 0..n-1", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "replace-list-keyed-replacer"
            expect(
                Data.dataReplace(["a", "b", "c"], { 1: "x", k: "y" }),
            ).toEqual({ 0: "a", 1: "x", 2: "c", k: "y" });
            expect(Data.dataReplace(["a", "b", "c"], { "01": "x" })).toEqual({
                0: "a",
                1: "b",
                2: "c",
                "01": "x",
            });
            expect(Data.dataReplace(["a"], { 3: "x" })).toEqual({
                0: "a",
                3: "x",
            });
        });
        it("is object", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const replacements = { b: 20, c: 30, d: 40 };
            const result = Data.dataReplace(obj, replacements);
            expect(result).toEqual({ a: 1, b: 20, c: 30, d: 40 });
        });
        it("is array", () => {
            const data = ["a", "b", "c"];
            const replacements = ["d", "e"];
            const result = Data.dataReplace(data, replacements);
            expect(result).toEqual(["d", "e", "c"]);
        });

        it("keeps a list backing's string key and gap, which arr.replace drops", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "replace-list-string-key-replacer", "replace-list-sparse-replacer"
            // obj serves the LIST backing too: arr.replace answers a list, dropping both keys.
            expect(Data.dataReplace(["a", "b", "c"], { k: "x" })).toEqual({
                0: "a",
                1: "b",
                2: "c",
                k: "x",
            });
            expect(Data.dataReplace(["a"], { 3: "d" })).toEqual({
                0: "a",
                3: "d",
            });
        });

        it("keeps an integer-like and a string key together on a list backing", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "replace-list-mixed-key-replacer"
            expect(Data.dataReplace(["a", "b"], { 1: "z", k: "x" })).toEqual({
                0: "a",
                1: "z",
                k: "x",
            });
        });

        it("replaces an object's integer keys from a list operand", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "object-backing-list-operand"
            expect(Data.dataReplace({ 0: "a", 1: "b", x: "c" }, ["z"])).toEqual(
                {
                    0: "z",
                    1: "b",
                    x: "c",
                },
            );
        });

        it("treats a null/undefined replacer as a no-op, for either backing", () => {
            // dataReplace's same-type guard used to reject `null` outright for an
            // object-backed `data` (there is no object-shaped spelling of "null"), so
            // Collection.replace(null) threw for an object-backed source.
            expect(Data.dataReplace({ a: 1, b: 2 }, null)).toEqual({
                a: 1,
                b: 2,
            });
            expect(Data.dataReplace({ a: 1, b: 2 }, undefined)).toEqual({
                a: 1,
                b: 2,
            });
            expect(Data.dataReplace(["a", "b"], null)).toEqual(["a", "b"]);
            expect(Data.dataReplace(["a", "b"], undefined)).toEqual(["a", "b"]);
        });

        it("unwraps a Collection-like replacer", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C16 replace assoc"
            expect(
                Data.dataReplace(
                    { name: "amir", family: "otwell" },
                    collectionLike({ name: "taylor", age: 26 }) as never,
                ),
            ).toEqual({ name: "taylor", family: "otwell", age: 26 });
        });

        it("keeps a sparse list backing's hole, as dataUnion already does (F-19)", () => {
            // JS-only: PHP has no array hole. `arr.union` fills one with `undefined`, so
            // a sparse backing must answer exactly like the dense list it stands for.
            const sparse = sparseList();
            expect(Data.dataReplace(sparse, { 0: "x" })).toStrictEqual([
                "x",
                undefined,
                "c",
            ]);
            expect(Data.dataReplace(sparse, { 0: "x" })).toStrictEqual(
                Data.dataReplace(["a", undefined, "c"], { 0: "x" }),
            );
            // The keyed backing has no hole to fill: a genuine gap stays a gap.
            expect(
                Data.dataReplace({ 0: "a", 2: "c" }, { 0: "x" }),
            ).toStrictEqual({ 0: "x", 2: "c" });
        });
    });

    describe("dataReplaceRecursive", () => {
        it("returns the keyed result when a replacer leaves a list backing's keys other than 0..n-1", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "replace-list-keyed-replacer"
            expect(
                Data.dataReplaceRecursive(["a", "b", "c"], { 1: "x", k: "y" }),
            ).toEqual({ 0: "a", 1: "x", 2: "c", k: "y" });
            expect(Data.dataReplaceRecursive(["a"], { 3: "x" })).toEqual({
                0: "a",
                3: "x",
            });
        });
        it("is object", () => {
            const obj = {
                user: { name: "John", address: { city: "NYC", zip: "10001" } },
                age: 30,
                locations: ["NYC", "LA", "CHI", "SF"],
            };
            const replacements = {
                user: { address: { city: "LA" } },
                age: 31,
                locations: ["DETROIT", "PORTLAND"],
            };
            const result = Data.dataReplaceRecursive(obj, replacements);
            expect(result).toEqual({
                user: { name: "John", address: { city: "LA", zip: "10001" } },
                age: 31,
                locations: ["DETROIT", "PORTLAND", "CHI", "SF"],
            });
        });
        it("is array", () => {
            const data = ["a", "b", ["c", "d"]];
            const replacements = ["d", "e", ["f", "g"]];
            const result = Data.dataReplaceRecursive(data, replacements);
            expect(result).toEqual(["d", "e", ["f", "g"]]);
        });

        it("keeps a list backing's string key and gap, which arr.replaceRecursive drops", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "replaceRecursive-list-string-key-replacer", "replaceRecursive-list-sparse-replacer"
            // obj serves the list backing here too, for the reason dataReplace gives above.
            expect(
                Data.dataReplaceRecursive(["a", "b", "c"], { k: "x" }),
            ).toEqual({ 0: "a", 1: "b", 2: "c", k: "x" });
            expect(Data.dataReplaceRecursive(["a"], { 3: "d" })).toEqual({
                0: "a",
                3: "d",
            });
        });

        it("keeps an integer-like and a string key together on a list backing", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "replaceRecursive-list-mixed-key-replacer"
            expect(
                Data.dataReplaceRecursive(["a", "b"], { 1: "z", k: "x" }),
            ).toEqual({ 0: "a", 1: "z", k: "x" });
        });

        it("accepts a sparse object-shaped replacer for array-backed data", () => {
            // PHP-verified: array_replace_recursive([['a'=>1],['b'=>2]],
            // [0=>['a'=>99]]) -> [{a:99},{b:2}].
            const result = Data.dataReplaceRecursive([{ a: 1 }, { b: 2 }], {
                0: { a: 99 },
            });
            expect(result).toEqual([{ a: 99 }, { b: 2 }]);
        });

        it("keeps a sparse list backing's hole, as dataUnion already does (F-19)", () => {
            // JS-only: PHP has no array hole. `arr.union` fills one with `undefined`, so
            // a sparse backing must answer exactly like the dense list it stands for.
            const sparse = sparseList();
            expect(Data.dataReplaceRecursive(sparse, { 0: "x" })).toStrictEqual(
                ["x", undefined, "c"],
            );
            expect(Data.dataReplaceRecursive(sparse, { 0: "x" })).toStrictEqual(
                Data.dataReplaceRecursive(["a", undefined, "c"], { 0: "x" }),
            );
            // The keyed backing has no hole to fill: a genuine gap stays a gap. Typed as a
            // record because the replacer shares `data`'s own TKey on this signature.
            const gapped: Record<string, string> = { 0: "a", 2: "c" };
            expect(Data.dataReplaceRecursive(gapped, { 0: "x" })).toStrictEqual(
                { 0: "x", 2: "c" },
            );
        });

        it("replaces an object's integer keys from a list operand", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "object-backing-list-operand"
            expect(
                Data.dataReplaceRecursive({ 0: "a", 1: "b", x: "c" }, ["z"]),
            ).toEqual({ 0: "z", 1: "b", x: "c" });
        });

        it("treats a null/undefined replacer as a no-op, for either backing", () => {
            // Same rationale as dataReplace's null pin above.
            expect(Data.dataReplaceRecursive({ a: 1 }, null)).toEqual({
                a: 1,
            });
            expect(Data.dataReplaceRecursive({ a: 1 }, undefined)).toEqual({
                a: 1,
            });
            expect(Data.dataReplaceRecursive(["a", "b"], null)).toEqual([
                "a",
                "b",
            ]);
            expect(Data.dataReplaceRecursive(["a", "b"], undefined)).toEqual([
                "a",
                "b",
            ]);
        });

        it("merges a nested list with a nested object by key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "D7 replaceRecursive nested list replaced by offset map"
            expect(
                Data.dataReplaceRecursive({ k: ["c", "d"] }, { k: { 1: "e" } }),
            ).toEqual({ k: ["c", "e"] });
        });
    });

    describe("dataReject", () => {
        it("is object", () => {
            expect(
                Data.dataReject({ a: 1, b: 2, c: 3 }, (value) => value > 1),
            ).toEqual({ a: 1 });
        });
        it("is array", () => {
            expect(Data.dataReject([1, 2, 3, 4], (value) => value > 2)).toEqual(
                [1, 2],
            );
        });

        it("preserves the original keys, through the object backing", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "reject-preserves-int-keys"
            // JS-only: the list backing renumbers; see the object case for the PHP key shape.
            expect(
                Data.dataReject(
                    { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5 },
                    (value) => value % 2 === 0,
                ),
            ).toEqual({ 0: 1, 2: 3, 4: 5 });
        });

        it("passes the key to the callback", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "reject-key-predicate"
            expect(
                Data.dataReject({ a: 1, b: 2 }, (_value, key) => key === "a"),
            ).toEqual({ b: 2 });
        });

        it("requires a callback rather than dropping truthy values", () => {
            // JS-only: Laravel's reject() with no callback drops truthy values
            // (docs/php-parity/task-24-data-release-readiness.json, "reject-no-callback").
            // The port requires a callback; calling without one throws TypeError instead.

            // @ts-expect-error - dataReject requires a callback
            expect(() => Data.dataReject([1, null, 2, false, 3])).toThrow(
                TypeError,
            );
        });
    });

    describe("dataReverse", () => {
        it("is object", () => {
            const result = Data.dataReverse({ a: 1, b: 2, c: 3 });
            expect(Object.keys(result)).toEqual(["c", "b", "a"]);
        });
        it("is array", () => {
            const result = Data.dataReverse([
                "house",
                "roof",
                ["doors", "table"],
                "floor",
            ]);
            expect(result).toEqual([
                "floor",
                ["doors", "table"],
                "roof",
                "house",
            ]);
        });

        it("reverses string keys with their values", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C5 reverse assoc"
            expect(
                Object.keys(
                    Data.dataReverse({ name: "taylor", framework: "laravel" }),
                ),
            ).toEqual(["framework", "name"]);
        });

        it("renumbers an integer-keyed backing instead of carrying the keys along", () => {
            // JS-only: PHP keeps each value on its original key (docs/php-parity/
            // task-11-final-fixes.json, "reverse preserves keys and reverses entry order").
            // JS can't express a descending int-key order, so this reverses and renumbers.
            expect(Data.dataReverse({ 0: "zaeed", 1: "alan" })).toEqual({
                0: "alan",
                1: "zaeed",
            });
            expect(Data.dataReverse([1, [2, 3], 4])).toEqual([4, [2, 3], 1]);
        });
    });

    describe("dataPad", () => {
        it("renumbers a negative integer key through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "pad-negative-int-key"
            expect(Data.dataPad({ "-1": "a", x: "b" }, 4, 0)).toEqual({
                0: "a",
                x: "b",
                1: 0,
                2: 0,
            });
        });
        it("is object", () => {
            const result = Data.dataPad({ a: 1, b: 2 }, 4, 0);
            expect(Object.keys(result)).toEqual(["0", "1", "a", "b"]);
        });
        it("is array", () => {
            const result = Data.dataPad([1, 2, 3, 4, 5], 7, 0);
            expect(result).toEqual([1, 2, 3, 4, 5, 0, 0]);
        });

        it("numbers negative pad slots from zero for object-backed data", () => {
            // PHP-verified: array_pad(["a"=>1,"b"=>2], -5, 0) ->
            // {"0":0,"1":0,"2":0,"a":1,"b":2} (docs/php-parity/task-07-pad-union.json).
            const result = Data.dataPad({ a: 1, b: 2 }, -5, 0);
            expect(result).toEqual({ 0: 0, 1: 0, 2: 0, a: 1, b: 2 });
        });

        it("returns a copy even when no padding is needed for object-backed data", () => {
            const data = { a: 1, b: 2 };
            expect(Data.dataPad(data, 2, 0)).not.toBe(data);
        });
    });

    describe("dataPartition", () => {
        it("is object", () => {
            const [passing2, failing2] = Data.dataPartition(
                { a: 1, b: 2, c: 3 },
                (value) => value > 1,
            );
            expect(passing2).toEqual({ b: 2, c: 3 });
            expect(failing2).toEqual({ a: 1 });
        });
        it("is array", () => {
            const [passing, failing] = Data.dataPartition(
                [1, 2, 3, 4],
                (value) => value > 2,
            );
            expect(passing).toEqual([3, 4]);
            expect(failing).toEqual([1, 2]);
        });

        it("preserves the original keys in both halves, through the object backing", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "partition-preserves-keys"
            // JS-only: the list backing renumbers both halves.
            const [passing, failing] = Data.dataPartition(
                { 0: "John", 1: "Jane", 2: "Greg" },
                (value) => value !== "Greg",
            );
            expect(passing).toEqual({ 0: "John", 1: "Jane" });
            expect(failing).toEqual({ 2: "Greg" });
        });

        it("returns two empty halves for an empty backing", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "partition-empty"
            expect(Data.dataPartition({}, () => true)).toEqual([{}, {}]);
            expect(Data.dataPartition([], () => true)).toEqual([[], []]);
        });

        it("passes the key to the callback", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "partition-key-predicate"
            const [passing, failing] = Data.dataPartition(
                { 1: "a", x: "b" },
                (_value, key) => typeof key === "number",
            );
            expect(passing).toEqual({ 1: "a" });
            expect(failing).toEqual({ x: "b" });
        });
    });

    describe("dataWhereNotNull", () => {
        it("is object", () => {
            expect(Data.dataWhereNotNull({ a: 1, b: null, c: 2 })).toEqual({
                a: 1,
                c: 2,
            });
        });
        it("is array", () => {
            expect(Data.dataWhereNotNull([1, null, 2, null, 3])).toEqual([
                1, 2, 3,
            ]);
        });

        it("keeps falsy values that are not null", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "whereNotNull-assoc-falsy"
            expect(
                Data.dataWhereNotNull({
                    a: null,
                    b: 0,
                    c: false,
                    d: "",
                    e: null,
                    f: [],
                }),
            ).toEqual({ b: 0, c: false, d: "", f: [] });
            // docs/php-parity/task-24-data-release-readiness.json,
            // "whereNotNull-list-preserves-keys"
            expect(
                Data.dataWhereNotNull([null, 0, false, "", null, []]),
            ).toEqual([0, false, "", []]);
        });

        it("returns an empty result when every value is null", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "whereNotNull-all-null"
            expect(Data.dataWhereNotNull({ a: null })).toEqual({});
            expect(Data.dataWhereNotNull([null, null])).toEqual([]);
        });

        it("keeps undefined, dropping only null", () => {
            // JS-only: PHP has a single null. The port's null check only matches `null`,
            // not `undefined`, so an `undefined` value survives; no probe applies. `toEqual`
            // on an object ignores undefined-valued properties, so pin with Object.keys too.
            const result = Data.dataWhereNotNull({
                a: 1,
                b: undefined,
                c: null,
            }) as Record<string, unknown>;
            expect(Object.keys(result)).toEqual(["a", "b"]);
            expect(result["b"]).toBeUndefined();
            expect(Data.dataWhereNotNull([1, undefined, null])).toEqual([
                1,
                undefined,
            ]);
        });
    });

    describe("dataValues", () => {
        it("is object", () => {
            expect(Data.dataValues({ a: 1, b: 2, c: 3 })).toEqual([1, 2, 3]);
        });
        it("is array", () => {
            expect(Data.dataValues([1, 2, 3])).toEqual([1, 2, 3]);
        });

        it("resets integer keys to a packed list", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C1 values resets int keys"
            expect(Data.dataValues({ 1: "a", 2: "b", 3: "c" })).toEqual([
                "a",
                "b",
                "c",
            ]);
        });

        it("returns an empty list for an empty backing", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "values-empty"
            expect(Data.dataValues({})).toEqual([]);
            expect(Data.dataValues([])).toEqual([]);
        });
    });

    describe("dataKeys", () => {
        it("is object", () => {
            expect(Data.dataKeys({ a: 1, b: 2, c: 3 })).toEqual([
                "a",
                "b",
                "c",
            ]);
        });
        it("is array", () => {
            expect(Data.dataKeys([1, 2, 3])).toEqual([0, 1, 2]);
        });

        it("reports the same number of keys as dataValues for object-backed data", () => {
            const data = Object.defineProperty({ a: 1 }, "hidden", {
                value: 2,
                enumerable: false,
            });
            expect(Data.dataKeys(data).length).toBe(
                Data.dataValues(data).length,
            );
        });
    });

    describe("dataFilter", () => {
        it("is object", () => {
            expect(
                Data.dataFilter(
                    { a: 1, b: 2, c: 3, d: 4 },
                    (value) => value > 2,
                ),
            ).toEqual({ c: 3, d: 4 });
        });
        it("is array", () => {
            expect(Data.dataFilter([1, 2, 3, 4], (value) => value > 2)).toEqual(
                [3, 4],
            );
        });

        // array_filter's falsy set is narrower than Boolean — PHP-verified
        // (docs/php-parity/task-04-shared.json, "Collection::filter() falsy set"): it
        // drops "0", "", 0, [], false, null, but keeps "00" and "0.0".
        it("drops PHP-falsy values including the string zero — both shapes agree", () => {
            expect(Data.dataFilter(["0", "", 0, "x"])).toEqual(["x"]);
            expect(Data.dataFilter({ a: "0", b: "", c: 0, d: "x" })).toEqual({
                d: "x",
            });
        });

        it("keeps strings that merely look like zero — both shapes agree", () => {
            expect(Data.dataFilter(["00", "0.0", "0"])).toEqual(["00", "0.0"]);
            expect(Data.dataFilter({ a: "00", b: "0.0", c: "0" })).toEqual({
                a: "00",
                b: "0.0",
            });
        });

        // The arr/obj layers pin NaN's truthiness — add it here too, both shapes.
        it("keeps NaN, which is truthy in PHP — both shapes agree", () => {
            expect(Data.dataFilter([NaN, 0, 1])).toEqual([NaN, 1]);
            expect(Data.dataFilter({ a: NaN, b: 0, c: 1 })).toEqual({
                a: NaN,
                c: 1,
            });
        });

        it("hands an object backing's integer key to the callback as a number", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "F1 filter callback key type for int key"
            expect(
                Data.dataFilter({ 1: "a", x: "b" }, (_value, key) => key === 1),
            ).toEqual({ 1: "a" });
        });
    });

    describe("dataMap", () => {
        it("is object", () => {
            expect(
                Data.dataMap({ a: 1, b: 2, c: 3 }, (value) => value * 2),
            ).toEqual({ a: 2, b: 4, c: 6 });
        });
        it("is array", () => {
            expect(Data.dataMap([1, 2, 3], (value) => value * 2)).toEqual([
                2, 4, 6,
            ]);
        });

        it("passes the key to the callback and stringifies a null value", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "map-null-values"
            // docs/php-parity/task-24-data-release-readiness.json, "map-list-index-key"
            expect(
                Data.dataMap(
                    { first: "taylor", last: null },
                    (value, key) => `${String(key)}-${value ?? ""}`,
                ),
            ).toEqual({ first: "first-taylor", last: "last-" });
            expect(
                Data.dataMap(
                    ["a", "b"],
                    (value, key) => `${String(key)}-${value}`,
                ),
            ).toEqual(["0-a", "1-b"]);
        });

        it("leaves the source untouched", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "map-source-unchanged"
            const source = { a: 1, b: 2 };
            expect(Data.dataMap(source, (value) => value * 2)).toEqual({
                a: 2,
                b: 4,
            });
            expect(source).toEqual({ a: 1, b: 2 });

            // docs/php-parity/task-24-data-release-readiness.json,
            // "map-source-unchanged-list"
            const listSource = [1, 2];
            expect(Data.dataMap(listSource, (value) => value * 2)).toEqual([
                2, 4,
            ]);
            expect(listSource).toEqual([1, 2]);
        });

        it("maps an empty backing to an empty result of the same shape", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "map-empty"
            expect(Data.dataMap({}, (value) => value)).toEqual({});
            expect(Data.dataMap([], (value) => value)).toEqual([]);
        });
    });

    describe("dataFirst", () => {
        it("is object", () => {
            expect(Data.dataFirst({ a: 1, b: 2, c: 3 })).toBe(1);
            expect(
                Data.dataFirst({ a: 1, b: 2, c: 3 }, (value) => value > 1),
            ).toBe(2);
            expect(
                Data.dataFirst({ a: 1, b: 2, c: 3 }, (value) => value > 3, 42),
            ).toBe(42);

            expect(
                Data.dataFirst(
                    { a: 1, b: 2, c: 3 },
                    (value) => value > 3,
                    undefined,
                ),
            ).toBeNull();

            // Test empty object returns null (no default)
            expect(Data.dataFirst({})).toBeNull();
            expect(Data.dataFirst({}, null, 99)).toBe(99);
        });
        it("is array", () => {
            expect(Data.dataFirst([1, 2, 3])).toBe(1);
            expect(Data.dataFirst([1, 2, 3], (value) => value > 1)).toBe(2);
            expect(Data.dataFirst([1, 2, 3], (value) => value > 3, 42)).toBe(
                42,
            );

            // Test empty array returns null when no default is provided
            // (triggers the true branch of isUndefined(result))
            expect(Data.dataFirst([])).toBeNull();
            expect(Data.dataFirst([], null)).toBeNull();

            // Test with default value
            expect(Data.dataFirst([], null, 99)).toBe(99);

            // Test callback that matches nothing without default
            expect(Data.dataFirst([1, 2, 3], (value) => value > 5)).toBeNull();
        });

        it("is a Map", () => {
            const items = new Map([
                ["first", 100],
                ["second", 200],
                ["third", 300],
            ]);

            expect(Data.dataFirst(items)).toBe(100);
            expect(
                Data.dataFirst(items, (_value, key) => key === "second"),
            ).toBe(200);
            // A Map reaches obj's widest row, whose callback takes `unknown`.
            expect(
                Data.dataFirst(
                    items,
                    (value) => Number(value) > 500,
                    "default",
                ),
            ).toBe("default");
            expect(Data.dataFirst(new Map(), null, "default")).toBe("default");
        });

        it("is an iterable", () => {
            const items = () =>
                (function* () {
                    yield 100;
                    yield 200;
                    yield 300;
                })();

            // Guards the streaming normalizer these four pass explicitly: it hands the Set or
            // generator on UNREAD, so a callback-less call answers an infinite generator; given a
            // callback `arrFirst` materialises, so that form still needs a finite backing.
            expect(Data.dataFirst(items())).toBe(100);
            expect(Data.dataFirst(items(), (value) => value > 150)).toBe(200);
            expect(Data.dataFirst(new Set([100, 200]))).toBe(100);
            expect(Data.dataFirst(new Set<number>(), null, "default")).toBe(
                "default",
            );
        });

        it("treats scalars as single positional items", () => {
            // Strings stay scalar rather than being walked character by
            // character, matching how PHP treats a string passed as iterable
            expect(Data.dataFirst("abc" as never)).toBe("abc");
            expect(Data.dataFirst(5 as never)).toBe(5);

            // Missing data resolves to the default, like null does
            expect(Data.dataFirst(undefined as never, null, "default")).toBe(
                "default",
            );
            expect(Data.dataFirst(null as never, null, "default")).toBe(
                "default",
            );
        });
    });

    describe("dataLast", () => {
        it("is object", () => {
            expect(Data.dataLast({ a: 1, b: 2, c: 3 })).toBe(3);
            expect(
                Data.dataLast({ a: 1, b: 2, c: 3 }, (value) => value < 3),
            ).toBe(2);
            expect(
                Data.dataLast({ a: 1, b: 2, c: 3 }, (value) => value < 1, 42),
            ).toBe(42);

            // Test with null callback (triggers else branch)
            expect(Data.dataLast({ a: 1, b: 2, c: 3 }, null)).toBe(3);
            expect(Data.dataLast({ a: 1, b: 2, c: 3 }, null, 42)).toBe(3);

            // Test empty object returns null
            expect(Data.dataLast({}, null)).toBeNull();
            expect(Data.dataLast({}, undefined, 99)).toBe(99);
        });
        it("is array", () => {
            expect(Data.dataLast([1, 2, 3])).toBe(3);
            expect(Data.dataLast([1, 2, 3], (value) => value < 3)).toBe(2);
            expect(Data.dataLast([1, 2, 3], (value) => value < 1, 42)).toBe(42);

            // Test with null callback (triggers else branch)
            expect(Data.dataLast([1, 2, 3], null)).toBe(3);
            expect(Data.dataLast([1, 2, 3], null, 42)).toBe(3);

            // Test empty array returns null
            expect(Data.dataLast([], null)).toBeNull();
            expect(Data.dataLast([], undefined, 99)).toBe(99);
        });

        it("is a Map", () => {
            const items = new Map([
                ["first", 100],
                ["second", 200],
                ["third", 300],
            ]);

            expect(Data.dataLast(items)).toBe(300);
            expect(Data.dataLast(items, (_value, key) => key !== "third")).toBe(
                200,
            );
            expect(Data.dataLast(new Map(), null, "default")).toBe("default");
        });

        it("is an iterable", () => {
            const items = () =>
                (function* () {
                    yield 100;
                    yield 200;
                    yield 300;
                })();

            // Guards the streaming normalizer these four pass explicitly: it hands the Set or
            // generator on UNREAD, but `last` has to walk to the end whatever it is handed, so the
            // backing must still be finite.
            expect(Data.dataLast(items())).toBe(300);
            expect(Data.dataLast(items(), (value) => value < 300)).toBe(200);
            expect(Data.dataLast(new Set([100, 200]))).toBe(200);
            expect(Data.dataLast(new Set<number>(), null, "default")).toBe(
                "default",
            );
        });

        it("treats scalars as single positional items", () => {
            expect(Data.dataLast("abc" as never)).toBe("abc");
            expect(Data.dataLast(5 as never)).toBe(5);
            expect(Data.dataLast(undefined as never, null, "default")).toBe(
                "default",
            );
            expect(Data.dataLast(null as never, null, "default")).toBe(
                "default",
            );
        });
    });

    describe("dataContains", () => {
        it("is object", () => {
            expect(Data.dataContains({ a: 1, b: 2, c: 3 }, 2)).toBe(true);
            expect(Data.dataContains({ a: 1, b: 2, c: 3 }, 42)).toBe(false);
            expect(
                Data.dataContains({ a: 1, b: 2, c: 3 }, (value) => value > 2),
            ).toBe(true);
            expect(
                Data.dataContains({ a: 1, b: 2, c: 3 }, (value) => value > 3),
            ).toBe(false);
        });
        it("is array", () => {
            expect(Data.dataContains([1, 2, 3], 2)).toBe(true);
            expect(Data.dataContains([1, 2, 3], 42)).toBe(false);
            expect(Data.dataContains([1, 2, 3], (value) => value > 2)).toBe(
                true,
            );
            expect(Data.dataContains([1, 2, 3], (value) => value > 3)).toBe(
                false,
            );
        });

        it("compares an array or object item by value when strict, through the object backing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "D4 containsStrict array by value"
            expect(Data.dataContains({ a: [1] }, [1], true)).toBe(true);
        });

        it("misses an object with the same entries in another order when strict, through both backings", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "containsStrict-key-order"
            expect(
                Data.dataContains({ a: { x: 1, y: 2 } }, { y: 2, x: 1 }, true),
            ).toBe(false);
            expect(
                Data.dataContains([{ x: 1, y: 2 }], { y: 2, x: 1 }, true),
            ).toBe(false);
        });

        it("reads a boolean third argument as strict, where PHP reads it as the value, on both backings", () => {
            // JS-only: docs/php-parity/task-24-data-release-readiness.json,
            // "r4-assoc-backed-operator-forms" records "key-true-assoc"/"key-true-list" as true.
            // This port's third parameter is `strict`, so PHP's call needs an explicit operator.
            const rows = { a: { active: true }, b: { active: false } };
            const list = [{ active: true }, { active: false }];

            expect(Data.dataContains(rows, "active", true)).toBe(false);
            expect(Data.dataContains(list, "active", true)).toBe(false);
            // "key-operator-true-assoc", also true, and its list twin.
            expect(Data.dataContains(rows, "active", "=", true)).toBe(true);
            expect(Data.dataContains(list, "active", "=", true)).toBe(true);
        });

        it("takes the key/operator/value form on both backings", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "r3-assoc-backed-contains", "operator" (the record backing) and
            // "r3-operator-table", "4 vs 4"/"4 vs \"4\"" (the same operators).
            const rows = {
                a: { v: 1 },
                b: { v: 3 },
                c: { v: "4" },
                d: { v: 5 },
            };
            const list = [{ v: 1 }, { v: 3 }, { v: "4" }, { v: 5 }];

            expect(Data.dataContains(rows, "v", "=", 4)).toBe(true);
            expect(Data.dataContains(list, "v", "=", 4)).toBe(true);
            expect(Data.dataContains(rows, "v", "===", 4)).toBe(false);
            expect(Data.dataContains(list, "v", "===", 4)).toBe(false);
            expect(Data.dataContains(rows, "v", ">", 4)).toBe(true);
            expect(Data.dataContains(list, "v", ">", 4)).toBe(true);
        });

        it("takes the key/value form and a null key on both backings", () => {
            // docs/php-parity/task-24-data-release-readiness.json: "r3-assoc-backed-contains"
            // ("key-value", "null-key"), "r3-list-backed-contains" ("key-value-no-match") and
            // "r4-assoc-backed-operator-forms" ("null-key-list").
            const three = { a: { v: 1 }, b: { v: 3 }, c: { v: 5 } };
            const threeList = [{ v: 1 }, { v: 3 }, { v: 5 }];

            expect(Data.dataContains(three, "v", 1)).toBe(true);
            expect(Data.dataContains(threeList, "v", 1)).toBe(true);
            expect(Data.dataContains(three, "v", 2)).toBe(false);
            expect(Data.dataContains(threeList, "v", 2)).toBe(false);
            expect(Data.dataContains({ a: 1, b: 2 }, null, ">", 1)).toBe(true);
            expect(Data.dataContains([1, 2], null, ">", 1)).toBe(true);
            expect(Data.dataContains({ a: 1, b: 2 }, null, ">", 9)).toBe(false);
        });

        it("shares PHP's `=` arm for a non-string operator on both backings", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "r4-assoc-backed-operator-forms", "non-string-operator-assoc" and
            // "non-string-operator-list": 5 names no case arm, so `default:` runs.
            expect(
                Data.dataContains({ a: { v: 5 }, b: { v: 6 } }, "v", 5, 6),
            ).toBe(true);
            expect(Data.dataContains([{ v: 5 }, { v: 6 }], "v", 5, 6)).toBe(
                true,
            );
        });
    });

    describe("dataDiff", () => {
        it("is object", () => {
            expect(
                Data.dataDiff({ a: 1, b: 2, c: 3 }, { b: 2, c: 3, d: 4 }),
            ).toEqual({ a: 1 });
        });
        it("is array", () => {
            expect(Data.dataDiff([1, 2, 3], [2, 3, 4])).toEqual([1]);
        });

        it("diffs on values only regardless of backing", () => {
            // Captured via docs/php-parity/task-06-setops.json ("diff — values only"):
            // neither "id" nor "first_word" exists as a key on `other`, so an
            // assoc-style diff would keep both.
            expect(
                Data.dataDiff({ id: 1, first_word: "Hello" }, { x: "Hello" }),
            ).toEqual({ id: 1 });
            expect(Data.dataDiff([1, 20], [99, 20])).toEqual([1]);
        });

        it("treats a null other as an unchanged copy rather than throwing", () => {
            expect(Data.dataDiff({ id: 1 }, null)).toEqual({ id: 1 });
        });

        it("treats a null/undefined other as empty for array-backed data too", () => {
            // Exercises the array branch's explicit nullish check (arrWrap(undefined)
            // would otherwise wrap it to [undefined] instead of [], see the source doc
            // comment).
            expect(Data.dataDiff([1, 2], null)).toEqual([1, 2]);
            expect(Data.dataDiff([1, 2], undefined)).toEqual([1, 2]);
        });

        it("diffs an object against a list by value, as PHP does", () => {
            // PHP-verified via docs/php-parity/task-06-setops.json ("diff and
            // intersect accept any array operand"): collect(['a'=>10,'b'=>20])
            // ->diff([20]) === ['a'=>10]; collect([10,20])->diff(['x'=>20]) === [10].
            expect(Data.dataDiff({ a: 10, b: 20 }, [20])).toEqual({ a: 10 });
            expect(Data.dataDiff([10, 20], { x: 20 })).toEqual([10]);
        });
    });

    describe("dataPluck", () => {
        it("is object", () => {
            expect(
                Data.dataPluck(
                    {
                        a: { id: 1, name: "House" },
                        b: { id: 2, name: "Condo" },
                        c: { id: 3, name: "Apartment" },
                    },
                    "name",
                ),
            ).toEqual(["House", "Condo", "Apartment"]);
        });
        it("is array", () => {
            expect(
                Data.dataPluck(
                    [
                        { id: 1, name: "House" },
                        { id: 2, name: "Condo" },
                        { id: 3, name: "Apartment" },
                    ],
                    "name",
                ),
            ).toEqual(["House", "Condo", "Apartment"]);
        });

        it("plucks a wildcard path the same way for array and object backing", () => {
            // dataPluck routes object input to Obj.pluck and array input to Arr.pluck.
            // The wildcard target here is a plain object, not a JS array: a list-shaped
            // target cannot catch arr's wildcard resolving an object target to [].
            const shape = { meta: { x: { v: 1 }, y: { v: 2 } } };
            const expected = [[1, 2]];
            expect(Data.dataPluck({ a: shape }, "meta.*.v")).toEqual(expected);
            expect(Data.dataPluck([shape], "meta.*.v")).toEqual(expected);
        });
    });

    describe("dataPop", () => {
        it("is object", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Data.dataPop(obj, 2);
            expect(result).toEqual([3, 2]);
            expect(obj).toEqual({ a: 1 });

            // Test with default count (1)
            const obj2 = { x: 10, y: 20 };
            const result2 = Data.dataPop(obj2);
            expect(result2).toBe(20);
            expect(obj2).toEqual({ x: 10 });
        });
        it("is array", () => {
            const arr = [1, 2, 3];
            const result = Data.dataPop(arr, 2);
            expect(result).toEqual([3, 2]);
            expect(arr).toEqual([1]);

            // Test with default count (1)
            const arr2 = [10, 20, 30];
            const result2 = Data.dataPop(arr2);
            expect(result2).toBe(30);
            expect(arr2).toEqual([10, 20]);
        });

        it("pops a count greater than the length, CollectionTest::testPopReturnsAndRemovesLastXItemsInCollection", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "pop-list-count-exceeds-length"
            const arr = ["foo", "bar", "baz"];
            expect(Data.dataPop(arr, 2)).toEqual(["baz", "bar"]);
            expect(arr).toEqual(["foo"]);

            const arr2 = ["foo", "bar", "baz"];
            expect(Data.dataPop(arr2, 6)).toEqual(["baz", "bar", "foo"]);
            expect(arr2).toEqual([]);

            // docs/php-parity/task-23-obj-release-readiness.json, "P2 pop(2)/pop(6) on assoc"
            const obj = { foo: "f", bar: "b", baz: "z" };
            expect(Data.dataPop(obj, 2)).toEqual(["z", "b"]);
            expect(obj).toEqual({ foo: "f" });

            const obj2 = { foo: "f", bar: "b", baz: "z" };
            expect(Data.dataPop(obj2, 6)).toEqual(["z", "b", "f"]);
            expect(obj2).toEqual({});
        });

        it("pops from an empty backing", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "pop-empty-default-count"
            expect(Data.dataPop([])).toBeNull();
            expect(Data.dataPop({})).toBeNull();

            // docs/php-parity/task-23-obj-release-readiness.json, "D6 shift/pop on collect(null)" (pop3)
            expect(Data.dataPop([], 3)).toEqual([]);
            expect(Data.dataPop({}, 3)).toEqual([]);
        });
    });

    describe("dataIntersect", () => {
        it("is object", () => {
            const obj1 = { a: 1, b: 2, c: 3 };
            const obj2 = { b: 2, c: 4 };
            const result = Data.dataIntersect(obj1, obj2);
            expect(result).toEqual({ b: 2 });
        });
        it("is array", () => {
            const data1 = [1, 2, 3, 4];
            const data2 = [3, 4, 5, 6];
            const result = Data.dataIntersect(data1, data2);
            expect(result).toEqual([3, 4]);
        });
        it("accepts an operand of any shape, like diff", () => {
            // A mismatched shape threw "Data to intersect must be of the same type".
            // PHP-verified in docs/php-parity/task-06-setops.json ("diff and intersect
            // accept any array operand"): array_intersect compares by value only.
            expect(Data.dataIntersect({ a: 1, b: 2 }, [2])).toEqual({ b: 2 });
            expect(Data.dataIntersect([10, 20], { x: 20 })).toEqual([20]);
        });

        it("intersects on values only regardless of backing", () => {
            // Captured via docs/php-parity/task-06-setops.json ("intersect — values
            // only, left keys"): the keys differ ("first_word" vs "first_world") and
            // the value still matches, keeping the left key.
            expect(
                Data.dataIntersect(
                    { id: 1, first_word: "Hello" },
                    { first_world: "Hello", last_word: "World" },
                ),
            ).toEqual({ first_word: "Hello" });
            expect(Data.dataIntersect([1, 20], [99, 20])).toEqual([20]);
        });

        it("treats a null/undefined other as empty rather than throwing", () => {
            expect(Data.dataIntersect({ a: 1 }, null)).toEqual({});
            expect(Data.dataIntersect([1, 2], null)).toEqual([]);
            expect(Data.dataIntersect({ a: 1 }, undefined)).toEqual({});
        });

        it("wraps a scalar backing as a one item list", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "intersect-scalar-backing"
            expect(Data.dataIntersect(5 as unknown as number[], [5])).toEqual([
                5,
            ]);
            expect(Data.dataIntersect({ 0: 5 }, [5])).toEqual({ 0: 5 });
        });
    });

    describe("dataIntersectByKeys", () => {
        it("is object", () => {
            const obj1 = { a: 1, b: 2, c: 3 };
            const obj2 = { b: 20, d: 40 };
            const result = Data.dataIntersectByKeys(obj1, obj2);
            expect(result).toEqual({ b: 2 });
        });
        it("is array", () => {
            const data1 = [1, 3, 5];
            const data2 = [2, 4];
            const result = Data.dataIntersectByKeys(data1, data2);
            expect(result).toEqual([1, 3]);
        });
        it("intersects an object with a list operand, and a list with a keyed operand, by key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "object-backing-list-operand", "list-backing-keyed-operand"
            expect(
                Data.dataIntersectByKeys({ 0: "a", 1: "b", x: "c" }, ["z"]),
            ).toEqual({ 0: "a" });
            expect(
                Data.dataIntersectByKeys(["a", "b", "c"], { 0: "x", 2: "y" }),
            ).toEqual(["a", "c"]);
        });

        it("treats a null other as empty rather than throwing", () => {
            expect(Data.dataIntersectByKeys({ name: "M" }, null)).toEqual({});
            expect(Data.dataIntersectByKeys([1, 2], null)).toEqual([]);
        });

        it("wraps a scalar backing as a one item list", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "intersectByKeys-scalar-backing"
            expect(
                Data.dataIntersectByKeys(5 as unknown as number[], [1]),
            ).toEqual([5]);
        });

        it("unwraps a Collection-like operand", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C19 intersectByKeys 2"
            const result = Data.dataIntersectByKeys(
                { name: "taylor", family: "otwell", age: 26 },
                collectionLike({
                    height: 180,
                    name: "amir",
                    family: "moharami",
                }) as never,
            );
            expect(result).toEqual({ name: "taylor", family: "otwell" });
        });
    });

    describe("dataExceptValues", () => {
        it("is object", () => {
            const obj1 = { name: "taylor", age: 26, city: "austin" };
            const result1 = Data.dataExceptValues(obj1, [26]);
            expect(result1).toEqual({ name: "taylor", city: "austin" });

            const result2 = Data.dataExceptValues(obj1, 26);
            expect(result2).toEqual({ name: "taylor", city: "austin" });

            const obj2 = { a: 1, b: 2, c: 1, d: 3 };
            const result3 = Data.dataExceptValues(obj2, 1);
            expect(result3).toEqual({ b: 2, d: 3 });

            const obj3 = { a: true, b: false, c: 1, d: 0 };
            const result4 = Data.dataExceptValues(obj3, [1, 0], true);
            expect(result4).toEqual({ a: true, b: false });

            const result5 = Data.dataExceptValues(obj3, [1, 0]);
            expect(result5).toEqual({});
        });

        it("is array", () => {
            const arr1 = ["foo", "bar", "baz", "qux"];
            const result1 = Data.dataExceptValues(arr1, ["foo", "baz"]);
            expect(result1).toEqual(["bar", "qux"]);

            const result2 = Data.dataExceptValues(arr1, "baz");
            expect(result2).toEqual(["foo", "bar", "qux"]);

            const arr2 = [1, 2, 3, 4, 5];
            const result3 = Data.dataExceptValues(arr2, [3, 4]);
            expect(result3).toEqual([1, 2, 5]);

            const arr3: unknown[] = [];
            const result4 = Data.dataExceptValues(arr3, "foo");
            expect(result4).toEqual([]);

            const arr4 = ["foo", "bar"];
            const result5 = Data.dataExceptValues(arr4, []);
            expect(result5).toEqual(["foo", "bar"]);

            const arr5 = [1, "1", 2, "2", 3];
            const result6 = Data.dataExceptValues(arr5, [1, 2, 3], true);
            expect(result6).toEqual(["1", "2"]);

            const result7 = Data.dataExceptValues(arr5, [1, 2, 3]);
            expect(result7).toEqual([]);
        });

        it("preserves the surviving keys, ArrTest::testExceptValues", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "exceptValues-list-keeps-gap"
            // PHP: Arr::exceptValues(['foo','bar','baz','qux'], ['foo','baz']) -> [1 => 'bar', 3 => 'qux']
            const obj = { 0: "foo", 1: "bar", 2: "baz", 3: "qux" };
            const objResult = Data.dataExceptValues(obj, ["foo", "baz"]);
            expect(Object.keys(objResult)).toEqual(["1", "3"]);
            expect(objResult).toEqual({ 1: "bar", 3: "qux" });

            // JS-only: a JS array can't hold a sparse integer key, so the list
            // backing reindexes to [0, 1] instead of preserving PHP's [1, 3] gap.
            const arr = ["foo", "bar", "baz", "qux"];
            const arrResult = Data.dataExceptValues(arr, ["foo", "baz"]);
            expect(Object.keys(arrResult)).toEqual(["0", "1"]);
            expect(arrResult).toEqual(["bar", "qux"]);
        });

        it("wraps a scalar or nullish backing as a list rather than throwing", () => {
            // JS-only: Collection has no exceptValues to wrap a scalar, and Arr::exceptValues
            // takes an array, so no PHP call records this. It is the family's own wrapping.
            expect(Data.dataExceptValues(5, [1])).toEqual([5]);
            expect(Data.dataExceptValues(5, [5])).toEqual([]);
            expect(Data.dataExceptValues("ab", [1])).toEqual(["ab"]);
            expect(Data.dataExceptValues(null, [1])).toEqual([]);
            expect(Data.dataExceptValues(undefined, [1])).toEqual([undefined]);
        });
    });

    describe("dataDiffAssoc", () => {
        it("is object", () => {
            const result = Data.dataDiffAssoc(
                { a: "green", b: "brown" },
                { a: "green", b: "yellow" },
            );
            expect(result).toEqual({ b: "brown" });
        });

        it("is array", () => {
            expect(Data.dataDiffAssoc([1, 2, 3], [1, 9, 3])).toEqual([2]);
        });

        it("matches a keyed operand by key on a list, never by position", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "diffAssoc-list-keyed-operand"
            expect(Data.dataDiffAssoc([1, 2], { a: 1, b: 2 })).toEqual([1, 2]);
        });

        it("wraps a scalar backing as a one item list", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "diffAssoc-scalar-backing"
            expect(
                Data.dataDiffAssoc(5 as unknown as number[], [1, 99, 3]),
            ).toEqual([5]);
        });

        it("unwraps a Collection-like operand when matching keys and values", () => {
            // C6's fixture shares no key+value pair with its operand either wrapped or
            // raw, so this key-matching case is what actually pins the unwrap.
            // docs/php-parity/task-23-obj-release-readiness.json, "diffAssoc-collection-matching-key"
            expect(
                Data.dataDiffAssoc(
                    { id: 1, name: "a" },
                    collectionLike({ id: 1, name: "b" }) as never,
                ),
            ).toEqual({ name: "a" });
        });
    });

    describe("dataDiffAssocUsing", () => {
        it("is object", () => {
            const result = Data.dataDiffAssocUsing(
                { a: "green", b: "brown" },
                { A: "green", c: "blue" },
                strcasecmp,
            );
            expect(result).toEqual({ b: "brown" });
        });

        it("unwraps a Collection-like operand", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C8 diffAssocUsing strcasecmp"
            const colors = { a: "green", b: "brown", c: "blue", 0: "red" };

            expect(
                Data.dataDiffAssocUsing(
                    colors,
                    collectionLike({
                        A: "green",
                        0: "yellow",
                        1: "red",
                    }) as never,
                    strcasecmp,
                ),
            ).toEqual({ b: "brown", c: "blue", 0: "red" });
        });

        it("is array — compares by index (key) via the callback, then value", () => {
            // PHP-verified directly : array_diff_uassoc([1,2,3],[2,3,4],strcasecmp) ->
            // [1,2,3].
            const result = Data.dataDiffAssocUsing(
                [1, 2, 3],
                [2, 3, 4],
                strcasecmp,
            );
            expect(result).toEqual([1, 2, 3]);
        });

        it("unwraps a Collection-like operand on a list", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "diffAssocUsing-list-collection-operand"
            expect(
                Data.dataDiffAssocUsing(
                    [1, 2, 3],
                    collectionLike([1, 9, 3]) as never,
                    strcasecmp,
                ),
            ).toEqual([2]);
        });

        it("compares values by PHP's string cast on a list", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "diffAssocUsing-list-string-cast"
            expect(
                Data.dataDiffAssocUsing(
                    [1, 2],
                    ["1", "3"] as never,
                    strcasecmp,
                ),
            ).toEqual([2]);
        });

        it("materializes a Set or generator backing, as every dispatch pair does", () => {
            // JS-only: PHP has neither. Both used to be wrapped whole as a single
            // element here, where dataDiffAssoc has always materialized them; the
            // dispatch conversion put the two families back in step.
            function* nums(): Generator<number> {
                yield 1;
                yield 2;
                yield 3;
            }

            expect(
                Data.dataDiffAssocUsing(
                    new Set([1, 2, 3]),
                    [1, 9, 3],
                    strcasecmp,
                ),
            ).toEqual([2]);
            expect(
                Data.dataDiffAssocUsing(nums(), [1, 9, 3], strcasecmp),
            ).toEqual([2]);
            expect(
                Data.dataDiffKeysUsing(new Set([1, 2, 3]), [9, 9], strcasecmp),
            ).toEqual([3]);
            expect(Data.dataDiffAssoc(new Set([1, 2, 3]), [1, 9, 3])).toEqual([
                2,
            ]);
        });

        it("hands the callback a list's indices as numbers, for diffKeysUsing too", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "callback-key *Using on a list"
            const seen = new Set<string>();
            const record = (a: PropertyKey, b: PropertyKey) => {
                seen.add(typeof a).add(typeof b);

                return a === b;
            };

            Data.dataDiffAssocUsing([1, 2], [1, 9], record);
            Data.dataDiffKeysUsing([1, 2], [1, 9], record);

            expect([...seen]).toEqual(["number"]);
        });
    });

    describe("dataDiffKeysUsing", () => {
        it("is object", () => {
            const result = Data.dataDiffKeysUsing(
                { id: 1, first_word: "Hello" },
                { ID: 123, foo_bar: "Hello" },
                strcasecmp,
            );
            expect(result).toEqual({ first_word: "Hello" });
        });

        it("is array — compares by index (key) via the callback only", () => {
            // PHP-verified directly : array_diff_ukey([1,2,3],[2,3,4],strcasecmp) -> []
            // (values are ignored entirely; every index 0-2 matches positionally, so
            // every entry is excluded).
            const result = Data.dataDiffKeysUsing(
                [1, 2, 3],
                [2, 3, 4],
                strcasecmp,
            );
            expect(result).toEqual([]);
        });

        it("unwraps a Collection-like operand", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C22 diffKeysUsing"
            const result = Data.dataDiffKeysUsing(
                { id: 1, first_word: "Hello" },
                collectionLike({ ID: 123, foo_bar: "Hello" }) as never,
                strcasecmp,
            );
            expect(result).toEqual({ first_word: "Hello" });
        });

        it("unwraps a Collection-like operand on a list", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "diffKeysUsing-list-collection-operand"
            expect(
                Data.dataDiffKeysUsing(
                    [1, 2, 3],
                    collectionLike([9, 9]) as never,
                    strcasecmp,
                ),
            ).toEqual([3]);
        });

        it("matches a keyed operand by key on a list, never by position", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "diffKeysUsing-list-keyed-operand"
            expect(
                Data.dataDiffKeysUsing([1, 2], { a: 1, 1: 5 }, strcasecmp),
            ).toEqual([1]);
        });
    });

    describe("dataIntersectAssoc", () => {
        it("is object", () => {
            const result = Data.dataIntersectAssoc(
                { a: "green", b: "brown" },
                { a: "green", b: "yellow" },
            );
            expect(result).toEqual({ a: "green" });
        });

        it("is array", () => {
            const result = Data.dataIntersectAssoc([1, 2, 3], [1, 2, 4]);
            expect(result).toEqual([1, 2]);

            const result2 = Data.dataIntersectAssoc([1, 2, 3], [2, 3, 4]);
            expect(result2).toEqual([]);
        });

        it("intersects an object with a list operand, and a list with a keyed operand, by key and value", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "object-backing-list-operand", "intersectAssoc-list-keyed-operand"
            expect(
                Data.dataIntersectAssoc({ 0: "a", 1: "b", x: "c" }, ["a"]),
            ).toEqual({ 0: "a" });
            expect(Data.dataIntersectAssoc(["a", "b"], { 1: "b" })).toEqual([
                "b",
            ]);
            expect(Data.dataIntersectAssoc([1, 2], { a: 1, b: 2 })).toEqual([]);
        });

        it("treats a null other as empty rather than throwing", () => {
            expect(Data.dataIntersectAssoc({ a: "green" }, null)).toEqual({});
            expect(Data.dataIntersectAssoc([1, 2], null)).toEqual([]);
        });

        it("wraps a scalar backing as a one item list", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "intersectAssoc-scalar-backing"
            expect(
                Data.dataIntersectAssoc(5 as unknown as number[], [5]),
            ).toEqual([5]);
        });

        it("unwraps a Collection-like operand", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "intersectAssoc-collection"
            const result = Data.dataIntersectAssoc(
                { a: "green", b: "brown", c: "blue", 0: "red" },
                collectionLike({
                    a: "green",
                    b: "yellow",
                    0: "blue",
                    1: "red",
                }) as never,
            );
            expect(result).toEqual({ a: "green" });
        });
    });

    describe("dataIntersectAssocUsing", () => {
        it("is object", () => {
            const strcasecmpKeys = (a: unknown, b: unknown) =>
                String(a).toLowerCase() === String(b).toLowerCase();
            const result = Data.dataIntersectAssocUsing(
                { a: "green", b: "brown" },
                { A: "GREEN", B: "brown" },
                strcasecmpKeys,
            );
            expect(result).toEqual({ b: "brown" });
        });

        it("is array", () => {
            const indexCallback = (a: number, b: number) => a === b;
            const result = Data.dataIntersectAssocUsing(
                [1, 2, 3],
                [1, 2, 4],
                indexCallback,
            );
            expect(result).toEqual([1, 2]);
        });

        it("intersects an object with a list operand, and a list with a keyed operand, using the callback", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "object-backing-list-operand", "intersectAssocUsing-list-keyed-operand"
            const sameKey = (a: unknown, b: unknown) => a === b;
            expect(
                Data.dataIntersectAssocUsing(
                    { 0: "a", 1: "b", x: "c" },
                    ["a"],
                    sameKey,
                ),
            ).toEqual({ 0: "a" });
            expect(
                Data.dataIntersectAssocUsing(["a", "b"], { 1: "b" }, sameKey),
            ).toEqual(["b"]);
            expect(
                Data.dataIntersectAssocUsing([1, 2], { a: 1, b: 2 }, sameKey),
            ).toEqual([]);
        });

        it("treats a null other as empty rather than throwing", () => {
            const strcasecmpKeys = (a: unknown, b: unknown) =>
                String(a).toLowerCase() === String(b).toLowerCase();
            expect(
                Data.dataIntersectAssocUsing(
                    { a: "green" },
                    null,
                    strcasecmpKeys,
                ),
            ).toEqual({});
            expect(
                Data.dataIntersectAssocUsing(
                    [1, 2],
                    null,
                    (a: number, b: number) => a === b,
                ),
            ).toEqual([]);
        });

        it("wraps a scalar backing as a one item list", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "intersectAssocUsing-scalar-backing"
            const sameKey = (a: unknown, b: unknown) => a === b;
            expect(
                Data.dataIntersectAssocUsing(
                    5 as unknown as number[],
                    [5],
                    sameKey,
                ),
            ).toEqual([5]);
            expect(
                Data.dataIntersectAssocUsing({ 0: 5 }, [5], sameKey),
            ).toEqual({ 0: 5 });
        });

        it("unwraps a Collection-like operand", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C9 intersectAssocUsing strcasecmp"
            const result = Data.dataIntersectAssocUsing(
                { a: "green", b: "brown", c: "blue", 0: "red" },
                collectionLike({
                    a: "GREEN",
                    B: "brown",
                    0: "yellow",
                    1: "red",
                }) as never,
                strcasecmp,
            );
            expect(result).toEqual({ b: "brown" });
        });
    });

    describe("dataOnlyValues", () => {
        it("is object", () => {
            const obj1 = { name: "taylor", age: 26, city: "austin" };
            const result1 = Data.dataOnlyValues(obj1, [26]);
            expect(result1).toEqual({ age: 26 });

            const result2 = Data.dataOnlyValues(obj1, 26);
            expect(result2).toEqual({ age: 26 });

            const obj2 = { a: 1, b: 2, c: 1, d: 3 };
            const result3 = Data.dataOnlyValues(obj2, 1);
            expect(result3).toEqual({ a: 1, c: 1 });

            const obj3 = { a: true, b: false, c: 1, d: 0 };
            const result4 = Data.dataOnlyValues(obj3, [1, 0], true);
            expect(result4).toEqual({ c: 1, d: 0 });

            const result5 = Data.dataOnlyValues(obj3, [1, 0]);
            expect(result5).toEqual({ a: true, b: false, c: 1, d: 0 });
        });

        it("is array", () => {
            const arr1 = ["foo", "bar", "baz", "qux"];
            const result1 = Data.dataOnlyValues(arr1, ["foo", "baz"]);
            expect(result1).toEqual(["foo", "baz"]);

            const result2 = Data.dataOnlyValues(arr1, "baz");
            expect(result2).toEqual(["baz"]);

            const arr2 = [1, 2, 3, 4, 5];
            const result3 = Data.dataOnlyValues(arr2, [3, 4]);
            expect(result3).toEqual([3, 4]);

            const arr3: unknown[] = [];
            const result4 = Data.dataOnlyValues(arr3, "foo");
            expect(result4).toEqual([]);

            const arr4 = ["foo", "bar"];
            const result5 = Data.dataOnlyValues(arr4, []);
            expect(result5).toEqual([]);

            const arr5 = [1, "1", 2, "2", 3];
            const result6 = Data.dataOnlyValues(arr5, [1, 2, 3], true);
            expect(result6).toEqual([1, 2, 3]);

            const result7 = Data.dataOnlyValues(arr5, [1, 2, 3]);
            expect(result7).toEqual([1, "1", 2, "2", 3]);
        });

        it("preserves the surviving keys, ArrTest::testOnlyValues", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "onlyValues-list-keeps-gap"
            // PHP: Arr::onlyValues(['foo','bar','baz','qux'], ['foo','baz']) -> [0 => 'foo', 2 => 'baz']
            const obj = { 0: "foo", 1: "bar", 2: "baz", 3: "qux" };
            const objResult = Data.dataOnlyValues(obj, ["foo", "baz"]);
            expect(Object.keys(objResult)).toEqual(["0", "2"]);
            expect(objResult).toEqual({ 0: "foo", 2: "baz" });

            // JS-only: a JS array can't hold a sparse integer key, so the list
            // backing reindexes to [0, 1] instead of preserving PHP's [0, 2] gap.
            const arr = ["foo", "bar", "baz", "qux"];
            const arrResult = Data.dataOnlyValues(arr, ["foo", "baz"]);
            expect(Object.keys(arrResult)).toEqual(["0", "1"]);
            expect(arrResult).toEqual(["foo", "baz"]);
        });

        it("wraps a scalar or nullish backing as a list rather than throwing", () => {
            // JS-only: Collection has no onlyValues to wrap a scalar, and Arr::onlyValues
            // takes an array, so no PHP call records this. It is the family's own wrapping.
            expect(Data.dataOnlyValues(5, [5])).toEqual([5]);
            expect(Data.dataOnlyValues(5, [1])).toEqual([]);
            expect(Data.dataOnlyValues("ab", ["ab"])).toEqual(["ab"]);
            expect(Data.dataOnlyValues(null, [1])).toEqual([]);
            expect(Data.dataOnlyValues(undefined, [undefined])).toEqual([
                undefined,
            ]);
        });
    });

    // Cross-backing agreement sweep, the plan's exit criterion: one test per
    // defect-matrix row, run over the same conceptual PHP array in both backings — a
    // real array and a plain object whose own keys are exactly that array's indices.
    describe("cross-backing agreement sweep (plan exit criterion)", () => {
        /** Own key/value pairs — the one view an array and a plain object share. */
        const entriesOf = (value: unknown): [string, unknown][] =>
            Object.entries(value as object);

        /**
         * Pin each backing's exact key/value pairs, then assert the value
         * sequence both produce is the same. `objEntries` defaults to
         * `arrEntries` for the rows where the keys match too.
         */
        function agree(
            arrResult: unknown,
            objResult: unknown,
            arrEntries: [string, unknown][],
            objEntries: [string, unknown][] = arrEntries,
        ): void {
            expect(entriesOf(arrResult)).toEqual(arrEntries);
            expect(entriesOf(objResult)).toEqual(objEntries);
            expect(Object.values(arrResult as object)).toEqual(
                Object.values(objResult as object),
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
        const recordsObj = (): Record<
            string,
            { id: number; name: string }
        > => ({
            0: { id: 3, name: "c" },
            1: { id: 1, name: "a" },
            2: { id: 2, name: "b" },
        });

        it("pop mutates and returns the last value", () => {
            // collect([10,20,30,40])->pop() -> 40, leaving [10,20,30];
            // ->pop(2) -> [40,30], leaving [10,20].
            const arrOne = nums();
            const objOne = numsObj();
            expect(Arr.pop(arrOne)).toBe(40);
            expect(Obj.pop(objOne)).toBe(40);
            agree(arrOne, objOne, [
                ["0", 10],
                ["1", 20],
                ["2", 30],
            ]);

            const arrTwo = nums();
            const objTwo = numsObj();
            agree(Arr.pop(arrTwo, 2), Obj.pop(objTwo, 2), [
                ["0", 40],
                ["1", 30],
            ]);
            agree(arrTwo, objTwo, [
                ["0", 10],
                ["1", 20],
            ]);

            const arrData = nums();
            const objData = numsObj();
            expect(Data.dataPop(arrData)).toBe(40);
            expect(Data.dataPop(objData)).toBe(40);
            agree(arrData, objData, [
                ["0", 10],
                ["1", 20],
                ["2", 30],
            ]);
        });

        it("shift mutates, returns the first value and renumbers", () => {
            // collect([10,20,30,40])->shift() -> 10, leaving [20,30,40] —
            // array_shift renumbers, so {1:20,2:30,3:40} is not the answer.
            const arrOne = nums();
            const objOne = numsObj();
            expect(Arr.shift(arrOne)).toBe(10);
            expect(Obj.shift(objOne)).toBe(10);
            agree(arrOne, objOne, [
                ["0", 20],
                ["1", 30],
                ["2", 40],
            ]);

            const arrTwo = nums();
            const objTwo = numsObj();
            agree(Arr.shift(arrTwo, 2), Obj.shift(objTwo, 2), [
                ["0", 10],
                ["1", 20],
            ]);
            agree(arrTwo, objTwo, [
                ["0", 30],
                ["1", 40],
            ]);

            const arrData = nums();
            const objData = numsObj();
            expect(Data.dataShift(arrData)).toBe(10);
            expect(Data.dataShift(objData)).toBe(10);
            agree(arrData, objData, [
                ["0", 20],
                ["1", 30],
                ["2", 40],
            ]);
        });

        it("shift throws on a negative count", () => {
            const message =
                "Number of shifted items may not be less than zero.";

            expect(() => Arr.shift(nums(), -1)).toThrow(message);
            expect(() => Obj.shift(numsObj(), -1)).toThrow(message);
            expect(() => Data.dataShift(nums(), -1)).toThrow(message);
            expect(() => Data.dataShift(numsObj(), -1)).toThrow(message);
        });

        it("shift on empty returns null for any count", () => {
            // The isEmpty() guard precedes every count branch.
            expect(Arr.shift([], 3)).toBeNull();
            expect(Obj.shift({}, 3)).toBeNull();
            expect(Arr.shift([])).toBeNull();
            expect(Obj.shift({})).toBeNull();
            expect(Data.dataShift([], 3)).toBeNull();
            expect(Data.dataShift({}, 3)).toBeNull();
        });

        it("push agrees on the array-guard message across both backings", () => {
            // dataPush([1,2,3],0,9) never threw at all, and the object path threw a
            // different, non-PHP message. PHP-verified in
            // docs/php-parity/task-12-regression-pins.json ("push requires an array at the key").
            const message =
                "Array value for key [0] must be an array, integer found.";

            expect(() => Arr.push([1, 2, 3], 0, 9)).toThrow(message);
            expect(() => Obj.push({ 0: 1, 1: 2, 2: 3 }, "0", 9)).toThrow(
                message,
            );
            expect(() => Data.dataPush([1, 2, 3], 0, 9)).toThrow(message);
            expect(() => Data.dataPush({ 0: 1, 1: 2, 2: 3 }, "0", 9)).toThrow(
                message,
            );
        });

        it("push creates the array at a missing key but rejects an explicit null", () => {
            // PHP-verified in docs/php-parity/task-12-regression-pins.json
            // ("push at a missing key creates the array" / "push through an explicit null").
            expect(Obj.push({}, "name", 9)).toEqual({ name: [9] });
            expect(Data.dataPush({}, "name", 9)).toEqual({ name: [9] });

            const nullMessage =
                "Array value for key [name] must be an array, NULL found.";
            expect(() => Obj.push({ name: null }, "name", 9)).toThrow(
                nullMessage,
            );
            expect(() => Data.dataPush({ name: null }, "name", 9)).toThrow(
                nullMessage,
            );
        });

        it("push appends into the array at the key on both backings", () => {
            // Both backings pushed the values NEXT TO the array at the key instead of
            // into it. PHP-verified in docs/php-parity/task-16-final-review.json
            // ("push appends into the array AT the key, never beside it").
            agree(
                Arr.push([["Desk"]], "0", "Chair"),
                Obj.push({ 0: ["Desk"] }, "0", "Chair"),
                [["0", ["Desk", "Chair"]]],
            );
            agree(
                Arr.push(["a", ["b"]], "1", "c", "d"),
                Obj.push({ 0: "a", 1: ["b"] }, "1", "c", "d"),
                [
                    ["0", "a"],
                    ["1", ["b", "c", "d"]],
                ],
            );
            agree(
                Data.dataPush([], "0", "value"),
                Data.dataPush({}, "0", "value"),
                [["0", ["value"]]],
            );

            // A multi-segment key creates the leaf array and pushes inside it.
            expect(Arr.push([], "0.0", "value")).toEqual([[["value"]]]);
            expect(Obj.push({}, "0.0", "value")).toEqual({
                0: { 0: ["value"] },
            });
            expect(Arr.push([[[1]]], "0.0", 9)).toEqual([[[1, 9]]]);
            expect(Obj.push({ a: { b: [1] } }, "a.b", 9)).toEqual({
                a: { b: [1, 9] },
            });
        });

        it("push appends with the next integer key when the key is null", () => {
            // docs/php-parity/task-17-second-review.json, "Arr::push with a null key on a list"
            agree(
                Data.dataPush([1, 2], null, 9),
                Data.dataPush({ 0: 1, 1: 2 }, null, 9),
                [
                    ["0", 1],
                    ["1", 2],
                    ["2", 9],
                ],
            );
        });

        it("unshift mutates and renumbers the existing integer keys", () => {
            // array_unshift([10,20,30,40],1,2) -> [1,2,10,20,30,40]. Writing
            // the prepended values at 0 and 1 destroyed 10 and 20 instead.
            const expected: [string, unknown][] = [
                ["0", 1],
                ["1", 2],
                ["2", 10],
                ["3", 20],
                ["4", 30],
                ["5", 40],
            ];

            const arrOne = nums();
            const objOne = numsObj();
            Arr.unshift(arrOne, 1, 2);
            Obj.unshift(objOne, 1, 2);
            agree(arrOne, objOne, expected);

            const arrData = nums();
            const objData = numsObj();
            Data.dataUnshift(arrData, 1, 2);
            Data.dataUnshift(objData, 1, 2);
            agree(arrData, objData, expected);
        });

        it("splice mutates and returns the removed items", () => {
            // collect([10,20,30,40])->splice(1,2) removes [20,30],
            // leaving [10,40].
            const arrSource = nums();
            const objSource = numsObj();
            agree(Arr.splice(arrSource, 1, 2), Obj.splice(objSource, 1, 2), [
                ["0", 20],
                ["1", 30],
            ]);
            agree(arrSource, objSource, [
                ["0", 10],
                ["1", 40],
            ]);

            const arrData = nums();
            const objData = numsObj();
            agree(
                Data.dataSplice(arrData, 1, 2),
                Data.dataSplice(objData, 1, 2),
                [
                    ["0", 20],
                    ["1", 30],
                ],
            );
            agree(arrData, objData, [
                ["0", 10],
                ["1", 40],
            ]);
        });

        it("splice with no length removes through to the end", () => {
            const arrSource = nums();
            const objSource = numsObj();

            agree(Arr.splice(arrSource, 1), Obj.splice(objSource, 1), [
                ["0", 20],
                ["1", 30],
                ["2", 40],
            ]);
            agree(arrSource, objSource, [["0", 10]]);
        });

        it("splice keeps string keys and reindexes integer keys", () => {
            // array_splice(['x'=>1,'y'=>2,'z'=>3],1,1) leaves {x:1,z:3} and
            // returns {y:2}; [10=>'a',20=>'b',30=>'c'] reindexes to
            // ['a','c'] and returns ['b'].
            const strings: Record<string, number> = { x: 1, y: 2, z: 3 };
            expect(entriesOf(Obj.splice(strings, 1, 1))).toEqual([["y", 2]]);
            expect(entriesOf(strings)).toEqual([
                ["x", 1],
                ["z", 3],
            ]);

            const sparse: Record<string, string> = {
                10: "a",
                20: "b",
                30: "c",
            };
            expect(entriesOf(Obj.splice(sparse, 1, 1))).toEqual([["0", "b"]]);
            expect(entriesOf(sparse)).toEqual([
                ["0", "a"],
                ["1", "c"],
            ]);
        });

        it("splice takes a bare scalar as one spliced-in element", () => {
            // array_splice([10,20,30,40],1,2,99) leaves [10,99,40].
            const arrSource = nums();
            const objSource = numsObj();

            agree(
                Arr.splice(arrSource, 1, 2, 99),
                Obj.splice(objSource, 1, 2, 99),
                [
                    ["0", 20],
                    ["1", 30],
                ],
            );
            agree(arrSource, objSource, [
                ["0", 10],
                ["1", 99],
                ["2", 40],
            ]);
        });

        it("splice with an object replacement discards its keys", () => {
            // docs/php-parity/task-17-second-review.json, "splice with an assoc replacement on a list"
            const arrSource = [1, 2, 3];
            const objSource: Record<string, number> = { 0: 1, 1: 2, 2: 3 };

            agree(
                Data.dataSplice(arrSource, 1, 1, { foo: "bar" } as never),
                Data.dataSplice(objSource, 1, 1, { foo: "bar" } as never),
                [["0", 2]],
            );
            agree(arrSource, objSource, [
                ["0", 1],
                ["1", "bar"],
                ["2", 3],
            ]);
        });

        it("replace does not mutate its source", () => {
            // array_replace([10,20,30,40],[1=>'d']) -> [10,'d',30,40].
            const arrSource = nums();
            const objSource = numsObj();
            const expected: [string, unknown][] = [
                ["0", 10],
                ["1", "d"],
                ["2", 30],
                ["3", 40],
            ];

            agree(
                Arr.replace(arrSource, { 1: "d" }),
                Obj.replace(objSource, { 1: "d" }),
                expected,
            );
            agree(arrSource, objSource, numsEntries);
        });

        it("replaceRecursive does not mutate its source", () => {
            // array_replace_recursive([['a'=>1],['b'=>2]],[['c'=>3]]) ->
            // [{a:1,c:3},{b:2}].
            const arrSource = [{ a: 1 }, { b: 2 }];
            const objSource: Record<string, Record<string, number>> = {
                0: { a: 1 },
                1: { b: 2 },
            };

            agree(
                Arr.replaceRecursive(arrSource, [{ c: 3 }]),
                Obj.replaceRecursive(objSource, { 0: { c: 3 } }),
                [
                    ["0", { a: 1, c: 3 }],
                    ["1", { b: 2 }],
                ],
            );
            agree(arrSource, objSource, [
                ["0", { a: 1 }],
                ["1", { b: 2 }],
            ]);
        });

        it("replace and replaceRecursive treat null as a no-op", () => {
            agree(
                Arr.replace(nums(), null),
                Obj.replace(numsObj(), null),
                numsEntries,
            );
            agree(
                Arr.replaceRecursive(nums(), null),
                Obj.replaceRecursive(numsObj(), null),
                numsEntries,
            );
            agree(
                Data.dataReplace(nums(), null),
                Data.dataReplace(numsObj(), null),
                numsEntries,
            );
        });

        it("intersect compares values only", () => {
            // collect([10,20,30,40])->intersect([20,40]) -> {1:20,3:40}.
            agree(
                Arr.intersect(nums(), [20, 40]),
                Obj.intersect(numsObj(), { 0: 20, 1: 40 }),
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
                Data.dataIntersect(nums(), [20, 40]),
                Data.dataIntersect(numsObj(), { 0: 20, 1: 40 }),
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

        it("diff compares values only", () => {
            // collect([10,20,30,40])->diff([20,40]) -> {0:10,2:30}.
            agree(
                Arr.diff(nums(), [20, 40]),
                Obj.diff(numsObj(), { 0: 20, 1: 40 }),
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
                Data.dataDiff(nums(), [20, 40]),
                Data.dataDiff(numsObj(), { 0: 20, 1: 40 }),
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

        it("diff also compares values across a mismatched operand shape (C5)", () => {
            // Every other row above pairs same-shape operands. PHP-verified via
            // docs/php-parity/task-06-setops.json ("diff and intersect accept any
            // array operand"): array_diff compares by value only, so shape doesn't matter.
            expect(Data.dataDiff({ a: 10, b: 20 }, [20])).toEqual({ a: 10 });
            expect(Data.dataDiff([10, 20], { x: 20 })).toEqual([10]);
        });

        it("diff wraps a scalar operand the same way on both backings", () => {
            // The array branch wrapped the scalar and the object branch treated it as
            // empty, so the two disagreed on the same call. PHP-verified:
            // docs/php-parity/task-16-final-review.json ("diff accepts an operand of any shape").
            expect(Arr.diff([1, "x"], "x")).toEqual([1]);
            expect(Obj.diff({ a: 1, b: "x" }, "x")).toEqual({ a: 1 });
            expect(Data.dataDiff([1, "x"], "x")).toEqual([1]);
            expect(Data.dataDiff({ a: 1, b: "x" }, "x")).toEqual({ a: 1 });
        });

        it("diffAssocUsing and diffKeysUsing run their comparator", () => {
            // array_diff_uassoc([10,20,30,40],[10,999,30,40],cmp) -> {1:20};
            // array_diff_ukey([10,20,30,40],[1=>'x',3=>'y'],cmp) -> {0:10,2:30}.
            const same = (a: PropertyKey, b: PropertyKey) => a === b;
            const sparseArray = Object.assign([] as unknown[], {
                1: "x",
                3: "y",
            });

            agree(
                Data.dataDiffAssocUsing(nums(), [10, 999, 30, 40], same),
                Data.dataDiffAssocUsing(
                    numsObj(),
                    { 0: 10, 1: 999, 2: 30, 3: 40 },
                    same,
                ),
                [["0", 20]],
                [["1", 20]],
            );
            const numsMixed: Record<string, unknown> = numsObj();
            agree(
                Data.dataDiffKeysUsing(nums(), sparseArray, same),
                Data.dataDiffKeysUsing(numsMixed, { 1: "x", 3: "y" }, same),
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

        it("intersect also compares values across a mismatched operand shape", () => {
            // The row diff's own mismatched-shape case sits next to: intersect kept
            // the same-type guard until the final review. PHP-verified:
            // docs/php-parity/task-06-setops.json ("diff and intersect accept any array operand").
            expect(Arr.intersect([10, 20], { x: 20 })).toEqual([20]);
            expect(Obj.intersect({ a: 1, b: 2 }, [2])).toEqual({ b: 2 });
            expect(Data.dataIntersect([10, 20], { x: 20 })).toEqual([20]);
            expect(Data.dataIntersect({ a: 1, b: 2 }, [2])).toEqual({ b: 2 });
        });

        it("the intersect family treats null as empty", () => {
            agree(
                Arr.intersect(nums(), null),
                Obj.intersect(numsObj(), null),
                [],
            );
            agree(
                Arr.intersectAssoc(nums(), null),
                Obj.intersectAssoc(numsObj(), null),
                [],
            );
            agree(
                Arr.intersectByKeys(nums(), null),
                Obj.intersectByKeys(numsObj(), null),
                [],
            );
        });

        it("intersectAssoc, intersectAssocUsing and intersectByKeys", () => {
            // array_intersect_assoc([10,20,30,40],[10,999,30]) -> {0:10,2:30};
            // array_intersect_key([10,20,30,40],[1=>'x',3=>'y']) -> {1:20,3:40}.
            const same = (a: PropertyKey, b: PropertyKey) => a === b;
            const sparseArray = Object.assign([] as unknown[], {
                1: "x",
                3: "y",
            });

            agree(
                Arr.intersectAssoc(nums(), [10, 999, 30]),
                Obj.intersectAssoc(numsObj(), { 0: 10, 1: 999, 2: 30 }),
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
                Arr.intersectAssocUsing(nums(), [10, 999, 30], same),
                Obj.intersectAssocUsing(
                    numsObj(),
                    { 0: 10, 1: 999, 2: 30 },
                    same,
                ),
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
                Arr.intersectByKeys(nums(), sparseArray),
                Obj.intersectByKeys(numsObj(), { 1: "x", 3: "y" }),
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

        it("slice handles a negative offset with a length", () => {
            // collect([10,20,30,40])->slice(-3,2) -> {1:20,2:30}.
            agree(
                Arr.slice(nums(), -3, 2),
                Obj.slice(numsObj(), -3, 2),
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

        it("filter drops PHP-falsy '0' but keeps '00' and '0.0'", () => {
            const mixed = ["0", "00", "0.0", "", 0, false, null, [], "a"];
            const mixedObj: Record<string, unknown> = {
                0: "0",
                1: "00",
                2: "0.0",
                3: "",
                4: 0,
                5: false,
                6: null,
                7: [],
                8: "a",
            };

            agree(
                Arr.filter(mixed),
                Obj.filter(mixedObj),
                [
                    ["0", "00"],
                    ["1", "0.0"],
                    ["2", "a"],
                ],
                [
                    ["1", "00"],
                    ["2", "0.0"],
                    ["8", "a"],
                ],
            );
        });

        it("pad numbers negative pad slots from zero", () => {
            // array_pad(['a'=>1,'b'=>2],-5,0) -> {0:0,1:0,2:0,a:1,b:2};
            // array_pad([10,20,30,40],-6,0) -> [0,0,10,20,30,40].
            expect(entriesOf(Obj.pad({ a: 1, b: 2 }, -5, 0))).toEqual([
                ["0", 0],
                ["1", 0],
                ["2", 0],
                ["a", 1],
                ["b", 2],
            ]);
            agree(Arr.pad(nums(), -6, 0), Obj.pad(numsObj(), -6, 0), [
                ["0", 0],
                ["1", 0],
                ["2", 10],
                ["3", 20],
                ["4", 30],
                ["5", 40],
            ]);
        });

        it("positive padding appends past the existing keys", () => {
            // array_pad([10,20,30,40],6,0) -> [10,20,30,40,0,0]. Numbering
            // the pad slots from 0 overwrote the first two entries, which a
            // value-list assertion could not see.
            agree(Arr.pad(nums(), 6, 0), Obj.pad(numsObj(), 6, 0), [
                ["0", 10],
                ["1", 20],
                ["2", 30],
                ["3", 40],
                ["4", 0],
                ["5", 0],
            ]);
            agree(Data.dataPad(nums(), 6, 0), Data.dataPad(numsObj(), 6, 0), [
                ["0", 10],
                ["1", 20],
                ["2", 30],
                ["3", 40],
                ["4", 0],
                ["5", 0],
            ]);
        });

        it("pad returns a copy when no padding is needed", () => {
            const source = numsObj();
            const result = Obj.pad(source, 2, 0);

            expect(result).not.toBe(source);
            agree(Arr.pad(nums(), 2, 0), result, numsEntries);
        });

        it("combine throws on a key/value count mismatch", () => {
            const message =
                "array_combine(): Argument #1 ($keys) and argument #2 ($values) must have the same number of elements";

            expect(() => Arr.combine(["a", "b"], [1])).toThrow(message);
            expect(() => Obj.combine({ 0: "a", 1: "b" }, { 0: 1 })).toThrow(
                message,
            );
            agree(
                Arr.combine(["a", "b", "c"], [1, 2, 3]),
                Obj.combine({ 0: "a", 1: "b", 2: "c" }, { 0: 1, 1: 2, 2: 3 }),
                [
                    ["a", 1],
                    ["b", 2],
                    ["c", 3],
                ],
            );
        });

        it("union lets the left operand win, null value included", () => {
            // ['a'=>null] + ['a'=>1] -> {a:null}; collect([10,20])
            // ->union([1,1,50,60]) -> [10,20,50,60].
            expect(entriesOf(Obj.union({ a: undefined }, { a: 1 }))).toEqual([
                ["a", undefined],
            ]);
            agree(
                Arr.union([10, 20], [1, 1, 50, 60]),
                Obj.union({ 0: 10, 1: 20 }, { 0: 1, 1: 1, 2: 50, 3: 60 }),
                [
                    ["0", 10],
                    ["1", 20],
                    ["2", 50],
                    ["3", 60],
                ],
            );
        });

        it("union treats a nullish operand as empty", () => {
            // getArrayableItems casts null to [], so collect([10,20])
            // ->union(null) -> [10,20] on either backing.
            agree(
                Arr.union(nums(), null),
                Obj.union(numsObj(), null),
                numsEntries,
            );
            agree(
                Data.dataUnion(nums(), null),
                Data.dataUnion(numsObj(), null),
                numsEntries,
            );
        });

        it("query casts booleans to 1 and 0", () => {
            // arr keeps the array backing: its rows no longer take a plain
            // object, so the keyed case belongs to obj.
            expect(Arr.query([true, false])).toBe("0=1&1=0");
            expect(Obj.query({ a: true, b: false })).toBe("a=1&b=0");
            expect(Arr.query(["a", "b"])).toBe("0=a&1=b");
            expect(Obj.query({ 0: "a", 1: "b" })).toBe("0=a&1=b");
            expect(Data.dataQuery(["a", "b"])).toBe("0=a&1=b");
            expect(Data.dataQuery({ 0: "a", 1: "b" })).toBe("0=a&1=b");
        });

        it("the CSS helpers emit the value for numeric keys", () => {
            expect(Arr.toCssClasses(["font-bold", "text-red"])).toBe(
                "font-bold text-red",
            );
            expect(Obj.toCssClasses({ 0: "font-bold", 1: "text-red" })).toBe(
                "font-bold text-red",
            );
            expect(Arr.toCssStyles(["color:red", "font-size:14px"])).toBe(
                "color:red; font-size:14px;",
            );
            expect(
                Obj.toCssStyles({ 0: "color:red", 1: "font-size:14px" }),
            ).toBe("color:red; font-size:14px;");
            expect(Data.dataToCssClasses(["font-bold", "text-red"])).toBe(
                "font-bold text-red",
            );
            expect(
                Data.dataToCssClasses({ 0: "font-bold", 1: "text-red" }),
            ).toBe("font-bold text-red");
        });

        it("random throws before the empty guard", () => {
            const message =
                "You requested 1 items, but there are only 0 items available.";

            expect(() => Arr.random([], 1)).toThrow(message);
            expect(() => Obj.random({}, 1)).toThrow(message);
            expect(() => Data.dataRandom([], 1)).toThrow(message);
            expect(() => Data.dataRandom({}, 1)).toThrow(message);
        });

        it("random's preserveKeys defaults to false", () => {
            // No value pin: random is non-deterministic by design. The keys
            // are the deterministic part — reindexed unless asked otherwise.
            expect(Object.keys(Arr.random(nums(), 2) as object)).toEqual([
                "0",
                "1",
            ]);
            expect(Object.keys(Obj.random(numsObj(), 2) as object)).toEqual([
                "0",
                "1",
            ]);
            expect(
                Object.keys(Obj.random(numsObj(), 2, true) as object).every(
                    (key) => Object.hasOwn(numsObj(), key),
                ),
            ).toBe(true);
        });

        it("only accepts a bare key and null", () => {
            // Arr::only([10,20,30,40],1) -> {1:20}; with null -> [].
            agree(
                Arr.only(nums(), 1),
                Obj.only(numsObj(), "1"),
                [["0", 20]],
                [["1", 20]],
            );
            agree(Arr.only(nums(), null), Obj.only(numsObj(), null), []);
            agree(
                Arr.only(nums(), [1, 3]),
                Obj.only(numsObj(), ["1", "3"]),
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

        it("get, has and exists resolve a literal dotted key first", () => {
            const dotted = { "a.b": "literal", a: { b: "nested" } };

            expect(Obj.get(dotted, "a.b")).toBe("literal");
            expect(Obj.has(dotted, "a.b")).toBe(true);
            expect(Obj.exists(dotted, "a.b")).toBe(true);

            expect(Arr.get(nums(), 2)).toBe(30);
            expect(Obj.get(numsObj(), 2)).toBe(30);
            expect(Arr.has(nums(), 2)).toBe(true);
            expect(Obj.has(numsObj(), 2)).toBe(true);
            expect(Arr.exists(nums(), 2)).toBe(true);
            expect(Obj.exists(numsObj(), 2)).toBe(true);
            expect(Data.dataExists(nums(), 2)).toBe(true);
            expect(Data.dataExists(numsObj(), 2)).toBe(true);
            expect(Data.dataExists(nums(), 9)).toBe(false);
            expect(Data.dataExists(numsObj(), 9)).toBe(false);
        });

        it("pluck supports keyed and wildcard paths", () => {
            // Arr::pluck(records,'name','id') -> {3:'c',1:'a',2:'b'}; JS
            // hoists those integer keys ascending, so the pairs are the
            // same and only the iteration order differs.
            const nested = [{ posts: [{ title: "p1" }, { title: "p2" }] }];
            const nestedObj = {
                0: { posts: [{ title: "p1" }, { title: "p2" }] },
            };

            agree(
                Arr.pluck(records(), "name"),
                Obj.pluck(recordsObj(), "name"),
                [
                    ["0", "c"],
                    ["1", "a"],
                    ["2", "b"],
                ],
            );
            agree(
                Arr.pluck(records(), "name", "id"),
                Obj.pluck(recordsObj(), "name", "id"),
                [
                    ["1", "a"],
                    ["2", "b"],
                    ["3", "c"],
                ],
            );
            agree(
                Arr.pluck(nested, "posts.*.title"),
                Obj.pluck(nestedObj, "posts.*.title"),
                [["0", ["p1", "p2"]]],
            );
        });

        it("sort accepts a key, a descriptor and an empty list", () => {
            // Integer-like keys are renumbered over the sorted sequence, so an
            // all-integer-keyed object reorders like the array does; PHP keeps the
            // key names instead (sort_all {"1":1,"2":2,"0":3} in the task-10 probe).
            agree(Arr.sort(records(), "id"), Obj.sort(recordsObj(), "id"), [
                ["0", { id: 1, name: "a" }],
                ["1", { id: 2, name: "b" }],
                ["2", { id: 3, name: "c" }],
            ]);
            expect(
                entriesOf(
                    Obj.sort(
                        { c: { id: 3 }, a: { id: 1 }, b: { id: 2 } },
                        "id",
                    ),
                ),
            ).toEqual([
                ["a", { id: 1 }],
                ["b", { id: 2 }],
                ["c", { id: 3 }],
            ]);

            // Arr::sort([3,1,2],[]) -> [3,1,2]: no comparisons, no reorder.
            agree(Arr.sort([3, 1, 2], []), Obj.sort({ 0: 3, 1: 1, 2: 2 }, []), [
                ["0", 3],
                ["1", 1],
                ["2", 2],
            ]);
        });

        it("sortDesc reverses the comparison, not the container", () => {
            // A negative alongside a zero: arsort(['a'=>-1,'b'=>0,'c'=>5]) is
            // {"c":5,"b":0,"a":-1} ("asort over PHP-falsy mixed values"), and an
            // integer-keyed object reorders now that the family renumbers its keys.
            agree(
                Arr.sortDesc([-1, 0, 5]),
                Obj.sortDesc({ 0: -1, 1: 0, 2: 5 }),
                [
                    ["0", 5],
                    ["1", 0],
                    ["2", -1],
                ],
            );
            expect(entriesOf(Obj.sortDesc({ a: -1, b: 0, c: 5 }))).toEqual([
                ["c", 5],
                ["b", 0],
                ["a", -1],
            ]);
            expect(entriesOf(Arr.sortDesc([30, 10, 20]))).toEqual([
                ["0", 30],
                ["1", 20],
                ["2", 10],
            ]);
            expect(entriesOf(Obj.sortDesc({ c: 30, a: 10, b: 20 }))).toEqual([
                ["c", 30],
                ["b", 20],
                ["a", 10],
            ]);
            expect(entriesOf(Data.dataSortDesc([30, 10, 20]))).toEqual([
                ["0", 30],
                ["1", 20],
                ["2", 10],
            ]);
        });

        it("flatten defaults to Infinity and stops only at depth 1", () => {
            // Arr::flatten([1,[2,[3]]]) -> [1,2,3]; at depth 1 -> [1,2,[3]];
            // at depth 2 -> [1,2,3]; at depth 0 it keeps descending.
            const nested = [1, [2, [3]]];
            const nestedObj = { 0: 1, 1: { 0: 2, 1: { 0: 3 } } };
            const flat: [string, unknown][] = [
                ["0", 1],
                ["1", 2],
                ["2", 3],
            ];

            agree(Arr.flatten(nested), Obj.flatten(nestedObj), flat);
            agree(Arr.flatten(nested, 2), Obj.flatten(nestedObj, 2), flat);
            agree(Arr.flatten(nested, 0), Obj.flatten(nestedObj, 0), flat);
            expect(entriesOf(Arr.flatten(nested, 1))).toEqual([
                ["0", 1],
                ["1", 2],
                ["2", [3]],
            ]);
            expect(entriesOf(Obj.flatten(nestedObj, 1))).toEqual([
                ["0", 1],
                ["1", 2],
                ["2", { 0: 3 }],
            ]);
            agree(
                Data.dataFlatten(nested, 2),
                Data.dataFlatten(nestedObj, 2),
                flat,
            );
        });

        it("mapWithKeys returns one plain container", () => {
            // Arr::mapWithKeys(records, fn -> [name => id]) -> {c:3,a:1,b:2};
            // with numeric keys -> {3:'c',1:'a',2:'b'}, which JS hoists
            // ascending. Neither backing may hand back a Map.
            agree(
                Arr.mapWithKeys(records(), (item) => ({
                    [item.name]: item.id,
                })),
                Obj.mapWithKeys(
                    recordsObj(),
                    (item: { id: number; name: string }) => ({
                        [item.name]: item.id,
                    }),
                ),
                [
                    ["c", 3],
                    ["a", 1],
                    ["b", 2],
                ],
            );
            agree(
                Arr.mapWithKeys(records(), (item) => ({
                    [item.id]: item.name,
                })),
                Obj.mapWithKeys(
                    recordsObj(),
                    (item: { id: number; name: string }) => ({
                        [item.id]: item.name,
                    }),
                ),
                [
                    ["1", "a"],
                    ["2", "b"],
                    ["3", "c"],
                ],
            );
        });

        it("keys and values read the same pairs off either backing", () => {
            agree(Arr.keys(nums()), Obj.keys(numsObj()), [
                ["0", 0],
                ["1", 1],
                ["2", 2],
                ["3", 3],
            ]);
            agree(Arr.values(nums()), Obj.values(numsObj()), numsEntries);
            agree(Data.dataKeys(nums()), Data.dataKeys(numsObj()), [
                ["0", 0],
                ["1", 1],
                ["2", 2],
                ["3", 3],
            ]);
        });

        it("reverse actually reverses an integer-keyed object", () => {
            // collect([10,20,30,40])->reverse() iterates 40,30,20,10.
            // Preserving PHP's keys would make this a no-op, because JS
            // re-sorts integer keys ascending on write.
            const reversed: [string, unknown][] = [
                ["0", 40],
                ["1", 30],
                ["2", 20],
                ["3", 10],
            ];

            agree(Arr.reverse(nums()), Obj.reverse(numsObj()), reversed);
            agree(
                Data.dataReverse(nums()),
                Data.dataReverse(numsObj()),
                reversed,
            );
            expect(entriesOf(Obj.reverse({ a: 1, b: 2, c: 3 }))).toEqual([
                ["c", 3],
                ["b", 2],
                ["a", 1],
            ]);
        });

        it("pull removes its key without renumbering the rest", () => {
            // collect([10,20,30,40])->pull(1) -> 20, leaving {0:10,2:30,3:40}
            // — unset, not array_splice, so no renumbering here.
            const arrSource = nums();
            const objSource = numsObj();

            expect(Data.dataPull(arrSource, 1).value).toBe(20);
            expect(Data.dataPull(objSource, 1).value).toBe(20);
            expect(entriesOf(Obj.pull(objSource, 1).data)).toEqual([
                ["0", 10],
                ["2", 30],
                ["3", 40],
            ]);
        });

        it("undot rebuilds the same nested list from either backing", () => {
            // Arr::undot(['0'=>'a','1.0'=>'b','1.1'=>'c']) -> ['a',['b','c']].
            const flat = { 0: "a", "1.0": "b", "1.1": "c" };

            agree(Arr.undot(flat), Obj.undot(flat), [
                ["0", "a"],
                ["1", ["b", "c"]],
            ]);
        });

        it("add stores a key that is no array index on either backing", () => {
            // Arr::add(['a','b'],'foo','X') -> {0:'a',1:'b',foo:'X'}.
            agree(
                Arr.add(["a", "b"], "foo", "X"),
                Obj.add({ 0: "a", 1: "b" }, "foo", "X"),
                [
                    ["0", "a"],
                    ["1", "b"],
                    ["foo", "X"],
                ],
            );
        });
    });

    describe("Set backing agreement sweep", () => {
        // JS-only: no PHP call takes a JS Set or generator, so the uncited rows below pin JS-side
        // agreement — the Set answers what the list it materializes to answers — not Laravel parity.
        // The cited rows carry the Traversable behaviour that makes materializing the right bar.
        const asSet = () => new Set([1, 2, 3]);
        const asList = () => [1, 2, 3];

        it("takes from a Set the way Laravel takes from a Traversable", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "take-traversable-backing"
            expect(Data.dataTake(asSet(), 2)).toEqual([1, 2]);
        });

        it("flattens a Set the way Laravel flattens a Traversable", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "flatten-traversable-backing"
            expect(Data.dataFlatten(asSet())).toEqual([1, 2, 3]);
        });

        it("reads a Set's values the way Laravel reads a Traversable's", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "values-traversable-backing"
            expect(Data.dataValues(asSet())).toEqual([1, 2, 3]);
        });

        it("answers has() off a Set's own indices", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "has-traversable-backing",
            // "has-traversable-backing-last-index", "has-traversable-backing-past-end"
            expect(Data.dataHas(asSet(), [0])).toBe(true);
            expect(Data.dataHas(asSet(), [2])).toBe(true);
            expect(Data.dataHas(asSet(), [3])).toBe(false);
        });

        it("draws from a Set instead of reporting one available item", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "random-traversable-backing-count"
            expect(Data.dataRandom(asSet(), 2)).toHaveLength(2);
        });

        it("slices a Set like the list it materializes to", () => {
            expect(Data.dataSlice(asSet(), 1)).toEqual(
                Data.dataSlice(asList(), 1),
            );
            expect(Data.dataChunk(asSet(), 2)).toEqual(
                Data.dataChunk(asList(), 2),
            );
        });

        it("maps a Set like the list it materializes to", () => {
            // A Set is an object, so it reaches obj's widest row, whose callback takes
            // `unknown` — the same widening a Map backing gets.
            const double = (value: unknown) => Number(value) * 2;
            expect(Data.dataMap(asSet(), double)).toEqual(
                Data.dataMap(asList(), double),
            );
        });

        it("filters a Set like the list it materializes to", () => {
            const aboveOne = (value: unknown) => Number(value) > 1;
            expect(Data.dataFilter(asSet(), aboveOne)).toEqual(
                Data.dataFilter(asList(), aboveOne),
            );
            expect(Data.dataContains(asSet(), 2)).toBe(
                Data.dataContains(asList(), 2),
            );
        });

        it("keys a Set like the list it materializes to", () => {
            expect(Data.dataKeys(asSet())).toEqual(Data.dataKeys(asList()));
            expect(Data.dataFlip(asSet())).toEqual(Data.dataFlip(asList()));
        });

        it("runs setops on a Set like the list it materializes to", () => {
            expect(Data.dataDiff(asSet(), [2])).toEqual(
                Data.dataDiff(asList(), [2]),
            );
            expect(Data.dataIntersect(asSet(), [2])).toEqual(
                Data.dataIntersect(asList(), [2]),
            );
        });

        it("outputs a Set like the list it materializes to", () => {
            expect(Data.dataJoin(asSet(), "-")).toBe(
                Data.dataJoin(asList(), "-"),
            );
            expect(Data.dataQuery(asSet())).toBe(Data.dataQuery(asList()));
        });

        it("mutates a Set's materialized copy like the list it stands for", () => {
            expect(Data.dataPop(asSet())).toBe(Data.dataPop(asList()));
            expect(Data.dataShift(asSet())).toBe(Data.dataShift(asList()));

            // The copy is what gets written, so the caller's Set is left alone: a stated
            // contract rather than an accident of materializing the backing.
            const set = asSet();
            Data.dataPop(set);
            expect([...set]).toEqual([1, 2, 3]);
        });

        it("reads a Set through the typed accessors like the list it stands for", () => {
            expect(Data.dataInteger(asSet(), 0, 0)).toBe(
                Data.dataInteger(asList(), 0, 0),
            );
            expect(Data.dataExists(asSet(), 2)).toBe(
                Data.dataExists(asList(), 2),
            );
        });

        it("walks a generator like the list it materializes to", () => {
            const generated = function* (): Generator<number> {
                yield 1;
                yield 2;
                yield 3;
            };
            expect(Data.dataTake(generated(), 2)).toEqual([1, 2]);
            expect(Data.dataValues(generated())).toEqual([1, 2, 3]);
        });

        it("still wraps a string backing as one item", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "take-string-backing", "flatten-string-backing", "values-string-backing"
            expect(Data.dataTake("abc", 2)).toEqual(["abc"]);
            expect(Data.dataFlatten("abc")).toEqual(["abc"]);
            expect(Data.dataValues("abc")).toEqual(["abc"]);
        });

        it("keeps writing through an array backing instead of a copy", () => {
            // The materialized branch must not catch an array: pop/shift/splice/unshift
            // mutate the caller's own array, which a spread copy would silently break.
            const list = [1, 2, 3];
            Data.dataPop(list);
            expect(list).toEqual([1, 2]);
            Data.dataUnshift(list, 0);
            expect(list).toEqual([0, 1, 2]);
        });
    });

    describe("Map backing agreement sweep", () => {
        // JS-only: PHP has no Map; these pin that a Map behaves as the keyed backing it
        // stands in for, rather than as empty data.
        const asMap = new Map<string, number>([
            ["a", 1],
            ["b", 2],
            ["c", 3],
        ]);
        const asRecord = { a: 1, b: 2, c: 3 };

        const nestedMap = new Map<string, Record<string, number>>([
            ["x", { p: 1, q: 2 }],
            ["y", { r: 3 }],
        ]);
        const nestedRecord = { x: { p: 1, q: 2 }, y: { r: 3 } };

        const listValuedMap = new Map<string, number[]>([
            ["a", [1, 2]],
            ["b", [3]],
        ]);
        const listValuedRecord = { a: [1, 2], b: [3] };

        const dottedMap = new Map<string, number>([
            ["a.b", 1],
            ["a.c", 2],
        ]);
        const dottedRecord = { "a.b": 1, "a.c": 2 };

        const typedMap = new Map<string, unknown>([
            ["flag", true],
            ["name", "John"],
            ["price", 9.99],
            ["count", 42],
        ]);
        const typedRecord = {
            flag: true,
            name: "John",
            price: 9.99,
            count: 42,
        };

        const repeatMap = new Map<string, number>([
            ["a", 1],
            ["b", 1],
            ["c", 2],
        ]);
        const repeatRecord = { a: 1, b: 1, c: 2 };

        const objectsMap = new Map<string, { id: number; name: string }>([
            ["x", { id: 1, name: "John" }],
            ["y", { id: 2, name: "Jane" }],
        ]);
        const objectsRecord = {
            x: { id: 1, name: "John" },
            y: { id: 2, name: "Jane" },
        };

        const cssClassMap = new Map<string, boolean>([
            ["btn", true],
            ["btn-primary", true],
            ["disabled", false],
        ]);
        const cssClassRecord = {
            btn: true,
            "btn-primary": true,
            disabled: false,
        };

        const cssStyleMap = new Map<string, string>([
            ["color", "red"],
            ["font-size", "14px"],
        ]);
        const cssStyleRecord = { color: "red", "font-size": "14px" };

        const nullableMap = new Map<string, number | null>([
            ["a", 1],
            ["b", null],
        ]);
        const nullableRecord = { a: 1, b: null };

        const pairMap = new Map<string, [number, number]>([
            ["0", [1, 2]],
            ["1", [3, 4]],
        ]);
        const pairRecord = { 0: [1, 2], 1: [3, 4] } as Record<
            string,
            [number, number]
        >;

        const arrValuedMap = new Map<string, number[]>([["a", [1, 2]]]);
        const arrValuedRecord = { a: [1, 2] };

        const strcasecmp = (a: unknown, b: unknown): boolean =>
            String(a).toLowerCase() === String(b).toLowerCase();

        it("dataAdd adds a key on a Map like the record it mirrors", () => {
            expect(Data.dataAdd(asMap, "d", 4)).toEqual(
                Data.dataAdd(asRecord, "d", 4),
            );
        });

        it("dataItem reads a nested value off a Map like the record it mirrors", () => {
            expect(Data.dataItem(nestedMap, "x")).toEqual(
                Data.dataItem(nestedRecord, "x"),
            );
        });

        it("dataBoolean reads a boolean off a Map like the record it mirrors", () => {
            expect(Data.dataBoolean(typedMap, "flag", false)).toBe(
                Data.dataBoolean(typedRecord, "flag", false),
            );
        });

        it("dataChunk chunks a Map like the record it mirrors", () => {
            expect(Data.dataChunk(asMap, 2)).toEqual(
                Data.dataChunk(asRecord, 2),
            );
        });

        it("dataChunkWhile chunks a Map like the record it mirrors", () => {
            // A Map reaches obj's widest row, whose callback takes `unknown`.
            const callback = (
                value: unknown,
                _key: PropertyKey,
                chunk: Record<string, unknown>,
            ): boolean => Object.values(chunk).at(-1) === value;
            expect(Data.dataChunkWhile(repeatMap, callback)).toEqual(
                Data.dataChunkWhile(repeatRecord, callback),
            );
        });

        it("dataChunkBy chunks a Map like the record it mirrors", () => {
            // A Map reaches obj's widest row, whose callback takes `unknown`.
            const key = (value: unknown): number => Number(value);
            expect(Data.dataChunkBy(repeatMap, key)).toEqual(
                Data.dataChunkBy(repeatRecord, key),
            );
        });

        it("dataCollapse collapses a Map like the record it mirrors", () => {
            expect(Data.dataCollapse(nestedMap)).toEqual(
                Data.dataCollapse(nestedRecord),
            );
        });

        it("dataCombine combines a Map's values as keys like the record it mirrors", () => {
            // dataCombine cannot be a dispatch pair: it normalizes the KEYS operand, which
            // dispatch only ever normalizes the first argument of, so it does that itself.
            expect(Data.dataCombine(asMap, ["x", "y", "z"])).toEqual(
                Data.dataCombine(asRecord, ["x", "y", "z"]),
            );
        });

        it("dataCount counts a Map like the record it mirrors", () => {
            expect(Data.dataCount(asMap)).toBe(Data.dataCount(asRecord));
        });

        it("dataCrossJoin cross joins a Map like the record it mirrors", () => {
            // Each key is its own dimension, so the other operand is keyed too.
            const dimensionMap = new Map<string, number[]>([["a", [1, 2]]]);
            const dimensionRecord = { a: [1, 2] };
            expect(Data.dataCrossJoin(dimensionMap, { b: [3, 4] })).toEqual(
                Data.dataCrossJoin(dimensionRecord, { b: [3, 4] }),
            );
        });

        it("dataDivide divides a Map like the record it mirrors", () => {
            expect(Data.dataDivide(asMap)).toEqual(Data.dataDivide(asRecord));
        });

        it("dataDot dots a Map like the record it mirrors", () => {
            expect(Data.dataDot(nestedMap)).toEqual(Data.dataDot(nestedRecord));
        });

        it("dataUndot undots a Map like the record it mirrors", () => {
            // dataUndot cannot be a dispatch pair: it answers a list or a record from the
            // same input, which no single delegate covers, so it normalizes its own backing.
            expect(Data.dataUndot(dottedMap)).toEqual(
                Data.dataUndot(dottedRecord),
            );
        });

        it("dataUnion unions a Map like the record it mirrors", () => {
            // dataUnion cannot be a dispatch pair: it folds a VARIADIC list of operands,
            // which no arr/obj pair takes, so it normalizes its own backing.
            expect(Data.dataUnion(asMap, { d: 4 })).toEqual(
                Data.dataUnion(asRecord, { d: 4 }),
            );
        });

        it("dataExcept excepts keys from a Map like the record it mirrors", () => {
            expect(Data.dataExcept(asMap, ["a"])).toEqual(
                Data.dataExcept(asRecord, ["a"]),
            );
        });

        it("dataExceptValues excepts values from a Map like the record it mirrors", () => {
            expect(Data.dataExceptValues(asMap, [2])).toEqual(
                Data.dataExceptValues(asRecord, [2]),
            );
        });

        it("dataExists checks a key on a Map like the record it mirrors", () => {
            expect(Data.dataExists(asMap, "a")).toBe(
                Data.dataExists(asRecord, "a"),
            );
        });

        it("dataTake takes from a Map like the record it mirrors", () => {
            expect(Data.dataTake(asMap, 2)).toEqual(Data.dataTake(asRecord, 2));
        });

        it("dataFlatten flattens a Map like the record it mirrors", () => {
            expect(Data.dataFlatten(listValuedMap)).toEqual(
                Data.dataFlatten(listValuedRecord),
            );
        });

        it("dataFlip flips a Map like the record it mirrors", () => {
            expect(Data.dataFlip(asMap)).toEqual(Data.dataFlip(asRecord));
        });

        it("dataFloat reads a float off a Map like the record it mirrors", () => {
            expect(Data.dataFloat(typedMap, "price", 0)).toBe(
                Data.dataFloat(typedRecord, "price", 0),
            );
        });

        it("dataForget forgets a key on a Map like the record it mirrors", () => {
            expect(Data.dataForget(asMap, ["a"])).toEqual(
                Data.dataForget(asRecord, ["a"]),
            );
        });

        it("dataFrom builds from a Map like the record it mirrors", () => {
            // obj.from already special-cases a Map (the one obj helper documented
            // to accept one), so this agrees today rather than staying red.
            expect(Data.dataFrom(asMap)).toEqual(Data.dataFrom(asRecord));
        });

        it("dataGet reads a Map like the record it mirrors", () => {
            expect(Data.dataGet(asMap, "a", null)).toBe(
                Data.dataGet(asRecord, "a", null),
            );
        });

        it("dataHas checks a Map like the record it mirrors", () => {
            expect(Data.dataHas(asMap, ["a"])).toBe(
                Data.dataHas(asRecord, ["a"]),
            );
        });

        it("dataHasAll checks a Map like the record it mirrors", () => {
            expect(Data.dataHasAll(asMap, ["a", "b"])).toBe(
                Data.dataHasAll(asRecord, ["a", "b"]),
            );
        });

        it("dataHasAny checks a Map like the record it mirrors", () => {
            expect(Data.dataHasAny(asMap, ["z", "a"])).toBe(
                Data.dataHasAny(asRecord, ["z", "a"]),
            );
        });

        it("dataEvery tests a Map like the record it mirrors", () => {
            // The Map goes in as itself: its row widens the callback's value to `unknown`,
            // so the shared callback is written for that and the record accepts it too.
            const aboveZero = (value: unknown) => Number(value) > 0;
            const above100 = (value: unknown) => Number(value) > 100;
            expect(Data.dataEvery(asMap, aboveZero)).toBe(
                Data.dataEvery(asRecord, aboveZero),
            );
            expect(Data.dataEvery(asMap, above100)).toBe(
                Data.dataEvery(asRecord, above100),
            );
        });

        it("dataSome tests a Map like the record it mirrors", () => {
            const aboveTwo = (value: unknown) => Number(value) > 2;
            const above100 = (value: unknown) => Number(value) > 100;
            expect(Data.dataSome(asMap, aboveTwo)).toBe(
                Data.dataSome(asRecord, aboveTwo),
            );
            expect(Data.dataSome(asMap, above100)).toBe(
                Data.dataSome(asRecord, above100),
            );
        });

        it("dataInteger reads an integer off a Map like the record it mirrors", () => {
            expect(Data.dataInteger(typedMap, "count", 0)).toBe(
                Data.dataInteger(typedRecord, "count", 0),
            );
        });

        it("dataJoin joins a Map like the record it mirrors", () => {
            expect(Data.dataJoin(asMap, ", ")).toBe(
                Data.dataJoin(asRecord, ", "),
            );
        });

        it("dataKeyBy keys a Map like the record it mirrors", () => {
            expect(Data.dataKeyBy(objectsMap, "id")).toEqual(
                Data.dataKeyBy(objectsRecord, "id"),
            );
        });

        it("dataPrependKeysWith prepends a Map's keys like the record it mirrors", () => {
            expect(Data.dataPrependKeysWith(asMap, "user_")).toEqual(
                Data.dataPrependKeysWith(asRecord, "user_"),
            );
        });

        it("dataOnly reads only keys off a Map like the record it mirrors", () => {
            expect(Data.dataOnly(asMap, ["a"])).toEqual(
                Data.dataOnly(asRecord, ["a"]),
            );
        });

        it("dataOnlyValues reads only values off a Map like the record it mirrors", () => {
            expect(Data.dataOnlyValues(asMap, [1])).toEqual(
                Data.dataOnlyValues(asRecord, [1]),
            );
        });

        it("dataSelect selects keys off a Map like the record it mirrors", () => {
            expect(Data.dataSelect(objectsMap, ["id"])).toEqual(
                Data.dataSelect(objectsRecord, ["id"]),
            );
        });

        it.fails(
            "dataMapWithKeys maps a Map like the record it mirrors",
            () => {
                // dataMapWithKeys cannot be a dispatch pair: it normalises the tuples the
                // callback returns, which neither delegate does, so nothing normalises a Map
                // for it and this row stays red.
                const callback = (
                    value: number,
                    key: string,
                ): [string, number] => [`${key}_key`, value * 2];
                expect(
                    Data.dataMapWithKeys(
                        asMap as unknown as Record<string, number>,
                        callback,
                    ),
                ).toEqual(Data.dataMapWithKeys(asRecord, callback));
            },
        );

        it("dataMapSpread maps a Map like the record it mirrors", () => {
            // A Map reaches obj's widest row, whose callback takes `unknown` args.
            expect(
                Data.dataMapSpread(pairMap, (a, b) => Number(a) + Number(b)),
            ).toEqual(
                Data.dataMapSpread(pairRecord, (a, b) => Number(a) + Number(b)),
            );
        });

        it("dataPrepend prepends onto a Map like the record it mirrors", () => {
            expect(Data.dataPrepend(asMap, 99, "z")).toEqual(
                Data.dataPrepend(asRecord, 99, "z"),
            );
        });

        it("dataPull pulls a value off a Map like the record it mirrors", () => {
            expect(Data.dataPull(asMap, "b", null).value).toBe(
                Data.dataPull(asRecord, "b", null).value,
            );
        });

        it("dataQuery builds a query string from a Map like the record it mirrors", () => {
            expect(Data.dataQuery(asMap)).toBe(Data.dataQuery(asRecord));
        });

        it("dataRandom reads a Map's elements like the record it mirrors", () => {
            // number === the full length so the randomness is only in the order.
            const fromMap = Object.values(
                Data.dataRandom(asMap, 3) as Record<string, number>,
            ).sort();
            const fromRecord = Object.values(
                Data.dataRandom(asRecord, 3) as Record<string, number>,
            ).sort();
            expect(fromMap).toEqual(fromRecord);
        });

        it("dataSearch finds a value in a Map like the record it mirrors", () => {
            expect(Data.dataSearch(asMap, 2)).toBe(
                Data.dataSearch(asRecord, 2),
            );
        });

        it("dataBefore reads the item before a value in a Map like the record it mirrors", () => {
            expect(Data.dataBefore(asMap, 2)).toBe(
                Data.dataBefore(asRecord, 2),
            );
        });

        it("dataAfter reads the item after a value in a Map like the record it mirrors", () => {
            expect(Data.dataAfter(asMap, 2)).toBe(Data.dataAfter(asRecord, 2));
        });

        it("dataShift shifts off a Map like the record it mirrors", () => {
            const mapCopy = new Map(asMap);
            const recordCopy = { ...asRecord };
            expect(Data.dataShift(mapCopy)).toBe(Data.dataShift(recordCopy));
        });

        it("dataSet sets a value on a Map like the record it mirrors", () => {
            expect(Data.dataSet(asMap, "d", 4)).toEqual(
                Data.dataSet(asRecord, "d", 4),
            );
        });

        it("dataPush pushes onto a Map like the record it mirrors", () => {
            expect(Data.dataPush(arrValuedMap, "a", 3)).toEqual(
                Data.dataPush(arrValuedRecord, "a", 3),
            );
        });

        it("dataUnshift unshifts onto a Map like the record it mirrors", () => {
            const mapCopy = new Map(asMap);
            const recordCopy = { ...asRecord };
            expect(Data.dataUnshift(mapCopy, 99)).toEqual(
                Data.dataUnshift(recordCopy, 99),
            );
        });

        it("dataShuffle shuffles a Map like the record it mirrors", () => {
            const fromMap = Object.values(Data.dataShuffle(asMap)).sort();
            const fromRecord = Object.values(Data.dataShuffle(asRecord)).sort();
            expect(fromMap).toEqual(fromRecord);
        });

        it("dataSlice slices a Map like the record it mirrors", () => {
            expect(Data.dataSlice(asMap, 1)).toEqual(
                Data.dataSlice(asRecord, 1),
            );
        });

        it("dataSole reads the sole match off a Map like the record it mirrors", () => {
            expect(Data.dataSole(asMap, (value) => value === 2)).toBe(
                Data.dataSole(asRecord, (value) => value === 2),
            );
        });

        it("dataSort sorts a Map like the record it mirrors", () => {
            expect(Object.values(Data.dataSort(asMap))).toEqual(
                Object.values(Data.dataSort(asRecord)),
            );
        });

        it("dataSortDesc sorts a Map like the record it mirrors", () => {
            expect(Object.values(Data.dataSortDesc(asMap))).toEqual(
                Object.values(Data.dataSortDesc(asRecord)),
            );
        });

        it("dataSortRecursive sorts a Map like the record it mirrors", () => {
            expect(Data.dataSortRecursive(nestedMap)).toEqual(
                Data.dataSortRecursive(nestedRecord),
            );
        });

        it("dataSortRecursiveDesc sorts a Map like the record it mirrors", () => {
            expect(Data.dataSortRecursiveDesc(nestedMap)).toEqual(
                Data.dataSortRecursiveDesc(nestedRecord),
            );
        });

        it("dataSplice splices a Map like the record it mirrors", () => {
            const mapCopy = new Map(asMap);
            const recordCopy = { ...asRecord };
            expect(Data.dataSplice(mapCopy, 1, 1)).toEqual(
                Data.dataSplice(recordCopy, 1, 1),
            );
        });

        it("dataString reads a string off a Map like the record it mirrors", () => {
            expect(Data.dataString(typedMap, "name", "")).toBe(
                Data.dataString(typedRecord, "name", ""),
            );
        });

        it("dataToCssClasses reads a Map like the record it mirrors", () => {
            expect(Data.dataToCssClasses(cssClassMap)).toBe(
                Data.dataToCssClasses(cssClassRecord),
            );
        });

        it("dataToCssStyles reads a Map like the record it mirrors", () => {
            expect(Data.dataToCssStyles(cssStyleMap)).toBe(
                Data.dataToCssStyles(cssStyleRecord),
            );
        });

        it("dataWhere filters a Map like the record it mirrors", () => {
            // A Map reaches obj's widest row, whose callback takes `unknown`.
            expect(
                Data.dataWhere(asMap, (value: unknown) => Number(value) > 1),
            ).toEqual(Data.dataWhere(asRecord, (value) => value > 1));
        });

        it("dataReplace replaces a Map like the record it mirrors", () => {
            expect(Data.dataReplace(asMap, { b: 20 })).toEqual(
                Data.dataReplace(asRecord, { b: 20 }),
            );
        });

        it("dataReplaceRecursive replaces a Map like the record it mirrors", () => {
            // A partial replacer (touching only "x", and only "p" within it) so a
            // surviving base value ("y", and "x.q") must come from the Map itself,
            // not merely echo back the replacer's own keys.
            const replacer = { x: { p: 99 } };
            const looseRecord = nestedRecord as Record<
                string,
                Record<string, number>
            >;
            expect(Data.dataReplaceRecursive(nestedMap, replacer)).toEqual(
                Data.dataReplaceRecursive(looseRecord, replacer),
            );
        });

        it("dataReject filters a Map like the record it mirrors", () => {
            // A Map reaches obj's widest row, whose callback takes `unknown`.
            expect(
                Data.dataReject(asMap, (value: unknown) => Number(value) > 1),
            ).toEqual(Data.dataReject(asRecord, (value) => value > 1));
        });

        it("dataReverse reverses a Map like the record it mirrors", () => {
            expect(Data.dataReverse(asMap)).toEqual(Data.dataReverse(asRecord));
        });

        it("dataPad pads a Map like the record it mirrors", () => {
            expect(Data.dataPad(asMap, 5, 0)).toEqual(
                Data.dataPad(asRecord, 5, 0),
            );
        });

        it("dataPartition partitions a Map like the record it mirrors", () => {
            // A Map reaches obj's widest row, whose callback takes `unknown`.
            expect(
                Data.dataPartition(
                    asMap,
                    (value: unknown) => Number(value) > 1,
                ),
            ).toEqual(Data.dataPartition(asRecord, (value) => value > 1));
        });

        it("dataWhereNotNull filters a Map like the record it mirrors", () => {
            expect(Data.dataWhereNotNull(nullableMap)).toEqual(
                Data.dataWhereNotNull(nullableRecord),
            );
        });

        it("dataValues reads a Map's values like the record it mirrors", () => {
            expect(Data.dataValues(asMap)).toEqual(Data.dataValues(asRecord));
        });

        it("dataKeys reads a Map's keys like the record it mirrors", () => {
            expect(Data.dataKeys(asMap)).toEqual(Data.dataKeys(asRecord));
        });

        it("dataFilter filters a Map like the record it mirrors", () => {
            // A Map reaches obj's widest row, whose callback takes `unknown`.
            expect(
                Data.dataFilter(asMap, (value: unknown) => Number(value) > 1),
            ).toEqual(Data.dataFilter(asRecord, (value) => value > 1));
        });

        it("dataMap maps a Map like the record it mirrors", () => {
            // A Map reaches obj's widest row, whose callback takes `unknown`.
            expect(
                Data.dataMap(asMap, (value: unknown) => Number(value) * 2),
            ).toEqual(Data.dataMap(asRecord, (value) => value * 2));
        });

        it("dataFirst reads the first value off a Map like the record it mirrors", () => {
            // objFirst already walks a Map through entriesOf, so this agrees
            // today rather than staying red.
            expect(Data.dataFirst(asMap)).toBe(Data.dataFirst(asRecord));
        });

        it("dataLast reads the last value off a Map like the record it mirrors", () => {
            expect(Data.dataLast(asMap)).toBe(Data.dataLast(asRecord));
        });

        it("dataContains checks a Map like the record it mirrors", () => {
            expect(Data.dataContains(asMap, 2)).toBe(
                Data.dataContains(asRecord, 2),
            );
        });

        it("dataDiff diffs a Map like the record it mirrors", () => {
            expect(Data.dataDiff(asMap, { b: 2 })).toEqual(
                Data.dataDiff(asRecord, { b: 2 }),
            );
        });

        it("dataDiffAssoc diffs a Map like the record it mirrors", () => {
            expect(
                Data.dataDiffAssoc(asMap, {
                    a: 1,
                    b: 99,
                    c: 3,
                }),
            ).toEqual(Data.dataDiffAssoc(asRecord, { a: 1, b: 99, c: 3 }));
        });

        it("dataDiffAssocUsing diffs a Map like the record it mirrors", () => {
            expect(
                Data.dataDiffAssocUsing(asMap, { B: 2 }, strcasecmp),
            ).toEqual(Data.dataDiffAssocUsing(asRecord, { B: 2 }, strcasecmp));
        });

        it("dataDiffKeysUsing diffs a Map's keys like the record it mirrors", () => {
            expect(
                Data.dataDiffKeysUsing(asMap, { B: 99 }, strcasecmp),
            ).toEqual(Data.dataDiffKeysUsing(asRecord, { B: 99 }, strcasecmp));
        });

        it("dataPluck plucks off a Map like the record it mirrors", () => {
            expect(Data.dataPluck(objectsMap, "name")).toEqual(
                Data.dataPluck(objectsRecord, "name"),
            );
        });

        it("dataPop pops off a Map like the record it mirrors", () => {
            const mapCopy = new Map(asMap);
            const recordCopy = { ...asRecord };
            expect(Data.dataPop(mapCopy)).toBe(Data.dataPop(recordCopy));
        });

        it("dataIntersect intersects a Map like the record it mirrors", () => {
            expect(Data.dataIntersect(asMap, [1, 2])).toEqual(
                Data.dataIntersect(asRecord, [1, 2]),
            );
        });

        it("dataIntersectAssoc intersects a Map like the record it mirrors", () => {
            expect(
                Data.dataIntersectAssoc(asMap, { a: 1, b: 99, c: 3 }),
            ).toEqual(Data.dataIntersectAssoc(asRecord, { a: 1, b: 99, c: 3 }));
        });

        it("dataIntersectAssocUsing intersects a Map like the record it mirrors", () => {
            expect(
                Data.dataIntersectAssocUsing(asMap, { A: 1 }, strcasecmp),
            ).toEqual(
                Data.dataIntersectAssocUsing(asRecord, { A: 1 }, strcasecmp),
            );
        });

        it("dataIntersectByKeys intersects a Map like the record it mirrors", () => {
            expect(Data.dataIntersectByKeys(asMap, { a: 1 })).toEqual(
                Data.dataIntersectByKeys(asRecord, { a: 1 }),
            );
        });
    });

    // `dispatch` converted every Map to a record before delegating, and a record re-sorts
    // integer keys ascending — so the four readers that answer BY POSITION answered from the
    // wrong end of an out-of-order backing. They are handed the Map itself now.
    describe("a Map's insertion order reaches the positional readers", () => {
        /** The PHP array `[2 => 'c', 0 => 'a', 1 => 'b']`, which only a Map expresses in JS. */
        const outOfOrder = () =>
            new Map([
                [2, "c"],
                [0, "a"],
                [1, "b"],
            ]);

        /** The keys a callback is offered, in the order it is offered them. */
        const keysSeen = (
            run: (
                callback: (value: unknown, key: unknown) => boolean,
            ) => unknown,
            answer: boolean,
        ) => {
            const seen: unknown[] = [];
            run((_value, key) => {
                seen.push(key);

                return answer;
            });

            return seen;
        };

        it("dataFirst and dataLast read a Map from PHP's ends", () => {
            // docs/php-parity/task-27-carried-fixes.json, "arr-first-out-of-order"
            expect(Data.dataFirst(outOfOrder())).toBe("c");

            // docs/php-parity/task-27-carried-fixes.json, "arr-last-out-of-order"
            expect(Data.dataLast(outOfOrder())).toBe("b");

            // docs/php-parity/task-27-carried-fixes.json, "arr-first-out-of-order-callback"
            expect(Data.dataFirst(outOfOrder(), (value) => value !== "c")).toBe(
                "a",
            );

            // docs/php-parity/task-27-carried-fixes.json, "arr-last-out-of-order-callback"
            expect(Data.dataLast(outOfOrder(), (value) => value !== "b")).toBe(
                "a",
            );
        });

        it("dataFirst and dataLast walk a Map in PHP's order", () => {
            // docs/php-parity/task-27-carried-fixes.json, "arr-first-out-of-order-key-order"
            expect(
                keysSeen((cb) => Data.dataFirst(outOfOrder(), cb), false),
            ).toEqual([2, 0, 1]);

            // docs/php-parity/task-27-carried-fixes.json, "arr-last-out-of-order-key-order"
            expect(
                keysSeen((cb) => Data.dataLast(outOfOrder(), cb), false),
            ).toEqual([1, 0, 2]);
        });

        it("dataEvery and dataSome walk a Map in PHP's order", () => {
            // docs/php-parity/task-27-carried-fixes.json, "every-out-of-order-key-order"
            expect(
                keysSeen((cb) => Data.dataEvery(outOfOrder(), cb), true),
            ).toEqual([2, 0, 1]);

            // docs/php-parity/task-27-carried-fixes.json, "contains-out-of-order-key-order"
            expect(
                keysSeen((cb) => Data.dataSome(outOfOrder(), cb), false),
            ).toEqual([2, 0, 1]);

            // docs/php-parity/task-27-carried-fixes.json, "contains-out-of-order-first-match"
            expect(
                keysSeen((cb) => Data.dataSome(outOfOrder(), cb), true),
            ).toEqual([2]);
        });

        it("each reader answers a Map exactly as its obj delegate does", () => {
            expect(Data.dataFirst(outOfOrder())).toBe(Obj.first(outOfOrder()));
            expect(Data.dataLast(outOfOrder())).toBe(Obj.last(outOfOrder()));
            expect(
                keysSeen((cb) => Data.dataEvery(outOfOrder(), cb), true),
            ).toEqual(keysSeen((cb) => Obj.every(outOfOrder(), cb), true));
            expect(
                keysSeen((cb) => Data.dataSome(outOfOrder(), cb), false),
            ).toEqual(keysSeen((cb) => Obj.some(outOfOrder(), cb), false));
        });

        it("the list backing holds the same order in its own positions", () => {
            // docs/php-parity/task-27-carried-fixes.json, "arr-first-out-of-order" and
            // "arr-last-out-of-order": the same three values, positionally.
            expect(Data.dataFirst(["c", "a", "b"])).toBe("c");
            expect(Data.dataLast(["c", "a", "b"])).toBe("b");
            expect(
                keysSeen((cb) => Data.dataFirst(["c", "a", "b"], cb), false),
            ).toEqual([0, 1, 2]);
        });

        it("the plain-object backing cannot hold that order", () => {
            const record = { 2: "c", 0: "a", 1: "b" };

            // JS-only: a JS object iterates integer keys ascending (ECMA-262
            // OrdinaryOwnPropertyKeys), so PHP's [2 => 'c', ...] is unreachable from a record
            // and `first` answers "a". The Map above is the only backing that keeps the order.
            expect(Data.dataFirst(record)).toBe("a");
            expect(Data.dataLast(record)).toBe("c");
            expect(keysSeen((cb) => Data.dataFirst(record, cb), false)).toEqual(
                [0, 1, 2],
            );
        });
    });
});
