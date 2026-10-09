import * as Path from "@tolki/path";
import { describe, expect, it } from "vitest";

/**
 * A stand-in for a Collection: an Enumerable that hands out its items through `all()` and reads them
 * through `offsetExists`, which treats a null item as absent, and `offsetGet`.
 */
class ItemsTarget {
    constructor(private readonly items: unknown[] | Record<string, unknown>) {}

    all(): unknown[] | Record<string, unknown> {
        return this.items;
    }

    offsetExists(key: string): boolean {
        const value = this.offsetGet(key);

        return value !== null && value !== undefined;
    }

    offsetGet(key: string): unknown {
        return Object.hasOwn(this.items, key)
            ? (this.items as Record<string, unknown>)[key]
            : undefined;
    }
}

/**
 * An ArrayAccess that is not Enumerable, whose `offsetExists` is PHP's isset.
 */
class AccessTarget {
    constructor(private readonly items: Record<string, unknown>) {}

    offsetExists(key: string): boolean {
        const value = this.items[key];

        return value !== null && value !== undefined;
    }

    offsetGet(key: string): unknown {
        return this.items[key];
    }
}

/**
 * An ArrayAccess whose `offsetExists` gives the same answer for every key.
 */
class AnsweringTarget {
    constructor(
        private readonly items: Record<string, unknown>,
        private readonly answer: unknown,
    ) {}

    offsetExists(): unknown {
        return this.answer;
    }

    offsetGet(key: string): unknown {
        return this.items[key];
    }
}

// PHP casts "0" and [] to false, and every object to true, however empty.
const answers = ["0", [], new Date(0), "x"];

/**
 * An object with one own field that holds null.
 */
class Point {
    p = null;
}

describe("Path Pluck Functions", () => {
    describe("resolvePluckPath", () => {
        it("reads a named segment through an Enumerable's items", () => {
            // docs/php-parity/Helpers/data_get.json, "C32-D-data-get-collection-target"
            expect(
                Path.resolvePluckPath(new ItemsTarget({ a: { b: 1 } }), [
                    "a",
                    "b",
                ]),
            ).toBe(1);
        });

        it("expands a wildcard over an Enumerable's items", () => {
            // docs/php-parity/Helpers/data_get.json, "C32-D-data-get-collection-target"
            expect(
                Path.resolvePluckPath(
                    new ItemsTarget([
                        new ItemsTarget({ b: 1 }),
                        new ItemsTarget({ b: 2 }),
                    ]),
                    ["*", "b"],
                ),
            ).toEqual([1, 2]);
        });

        it("never reads an Enumerable's own fields as its items", () => {
            // docs/php-parity/Helpers/data_get.json, "C32-D-data-get-collection-target"
            expect(
                Path.resolvePluckPath(new ItemsTarget({ a: 1 }), ["items"]),
            ).toBeNull();
        });

        it("reads an ArrayAccess through offsetExists and offsetGet", () => {
            // docs/php-parity/Helpers/data_get.json, "C32-D-data-get-arrayaccess-target"
            const target = new AccessTarget({ a: 1, n: null });

            expect(Path.resolvePluckPath(target, ["a"])).toBe(1);
            expect(Path.resolvePluckPath(target, ["missing"])).toBeNull();
        });

        it("judges an ArrayAccess's offsetExists answer by PHP truthiness", () => {
            // docs/php-parity/Helpers/data_get.json, "C32-D-data-get-offset-exists-php-truthiness"
            expect(
                answers.map((answer) =>
                    Path.resolvePluckPath(
                        new AnsweringTarget({ a: 1 }, answer),
                        ["a"],
                    ),
                ),
            ).toEqual([null, null, 1, 1]);
        });

        it("reads a plain object's own keys, whatever members it has", () => {
            // docs/php-parity/Collection/collapse.json, "C32-E-array-item-all-member-is-data":
            // a plain object models a PHP array, so an `all` or `offsetGet` member is data, not an interface.
            const item = {
                all: () => ({ a: "from all" }),
                offsetGet: () => "from offsetGet",
                a: "own",
            };

            expect(Path.resolvePluckPath(item, ["a"])).toBe("own");
            expect(Path.resolvePluckPath(item, ["b"])).toBeNull();
        });

        it("reads an array path's dotted segment as one literal key", () => {
            // docs/php-parity/Helpers/data_get.json, "C32-D-data-get-array-path-dotted-segment"
            expect(
                Path.resolvePluckPath({ "a.b": 1, a: { b: 2 } }, ["a.b"]),
            ).toBe(1);
        });

        it("reads a Map's entries, as the array it stands for", () => {
            // docs/php-parity/Collection/pluck.json, "C32-E-pluck-nested-array-row"
            expect(Path.resolvePluckPath(new Map([["n", 1]]), ["n"])).toBe(1);
            expect(
                Path.resolvePluckPath(
                    new Map<unknown, unknown>([
                        [1, "one"],
                        ["01", "zero-one"],
                    ]),
                    ["1"],
                ),
            ).toBe("one");
            expect(
                Path.resolvePluckPath(new Map([["01", "zero-one"]]), ["1"]),
            ).toBeNull();
        });

        it("expands a wildcard over a Map's values", () => {
            // docs/php-parity/Collection/pluck.json, "C32-E-pluck-nested-array-row"
            expect(Path.resolvePluckPath(new Map([["n", 1]]), ["*"])).toEqual([
                1,
            ]);
        });

        it("reads a stored undefined as null", () => {
            // JS-only: PHP has no undefined; a path that reaches one answers null, as a missing key does.
            expect(Path.resolvePluckPath({ a: undefined }, ["a"])).toBeNull();
        });
    });

    describe("hasPluckPath", () => {
        it("finds a key an Enumerable holds, even when it holds null", () => {
            // docs/php-parity/Helpers/data_has.json, "C32-D-data-has-collection-target"
            expect(Path.hasPluckPath(new ItemsTarget({ v: null }), ["v"])).toBe(
                true,
            );
            expect(
                Path.hasPluckPath(new ItemsTarget({ a: { b: 1 } }), ["a", "b"]),
            ).toBe(true);
            expect(Path.hasPluckPath(new ItemsTarget({ a: 1 }), ["b"])).toBe(
                false,
            );
        });

        it("asks an ArrayAccess that is not Enumerable through offsetExists", () => {
            // docs/php-parity/Helpers/data_get.json, "C32-D-data-get-arrayaccess-target"
            const target = new AccessTarget({ a: 1, n: null });

            expect(Path.hasPluckPath(target, ["n"])).toBe(false);
            expect(Path.hasPluckPath(target, ["a"])).toBe(true);
        });

        it("judges an ArrayAccess's offsetExists answer by PHP truthiness", () => {
            // docs/php-parity/Helpers/data_get.json, "C32-D-data-get-offset-exists-php-truthiness"
            expect(
                answers.map((answer) =>
                    Path.hasPluckPath(new AnsweringTarget({ a: 1 }, answer), [
                        "a",
                    ]),
                ),
            ).toEqual([false, false, true, true]);
        });

        it("finds a key an array or an object holds, even when it holds null", () => {
            // docs/php-parity/Helpers/data_has.json, "C32-D-data-has-array-and-object-targets"
            expect(Path.hasPluckPath({ a: null }, ["a"])).toBe(true);
            expect(Path.hasPluckPath([10, 20], ["1"])).toBe(true);
            expect(Path.hasPluckPath([10], ["01"])).toBe(false);
            expect(Path.hasPluckPath(new Point(), ["p"])).toBe(true);
            expect(Path.hasPluckPath(new Point(), ["q"])).toBe(false);
        });

        it("finds a key a Map holds, even when it holds null, as the array it stands for", () => {
            // docs/php-parity/Helpers/data_has.json, "C32-D-data-has-array-and-object-targets"
            expect(Path.hasPluckPath(new Map([["a", null]]), ["a"])).toBe(true);
            expect(Path.hasPluckPath(new Map([[1, 10]]), ["1"])).toBe(true);
            expect(Path.hasPluckPath(new Map([[0, 10]]), ["01"])).toBe(false);
        });

        it("answers false for no path at all", () => {
            // docs/php-parity/Helpers/data_has.json, "C32-D-data-has-collection-target"
            expect(Path.hasPluckPath({ a: 1 }, [])).toBe(false);
        });

        it("answers false once a segment reaches a scalar", () => {
            // docs/php-parity/Collection/where.json, "C32-D-item-paths-by-backing":
            // value('a.b', 'miss') over ['a.b' => 1] finds no item, since 'a' holds no array.
            expect(Path.hasPluckPath({ "a.b": 1 }, ["a", "b"])).toBe(false);
        });
    });

    describe("readPluckKey", () => {
        it("tells a key that holds null from a missing one", () => {
            // docs/php-parity/Helpers/data_has.json, "C32-D-data-has-array-and-object-targets"
            expect(Path.readPluckKey({ a: null }, "a")).toEqual([true, null]);
            expect(Path.readPluckKey({ a: 1 }, "b")).toEqual([
                false,
                undefined,
            ]);
        });

        it("reads an ArrayAccess that is not Enumerable through offsetExists", () => {
            // docs/php-parity/Helpers/data_get.json, "C32-D-data-get-arrayaccess-target"
            const target = new AccessTarget({ a: 1, n: null });

            expect(Path.readPluckKey(target, "a")).toEqual([true, 1]);
            expect(Path.readPluckKey(target, "n")).toEqual([false, undefined]);
        });
    });
});
