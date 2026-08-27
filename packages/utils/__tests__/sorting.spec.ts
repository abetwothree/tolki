import type { SortSpec } from "@tolki/types";
import { createSortSpecComparator } from "@tolki/utils";
import { describe, expect, it } from "vitest";

type Row = { age: number };

// Stands in for the resolvers the packages inject: getNestedValue in
// arr/obj, dataGet in collection.
const readOwnKey = (item: unknown, key: string) =>
    (item as Record<string, unknown>)[key];

const comparatorFor = (spec: SortSpec<Row>, forceDescending = false) =>
    createSortSpecComparator(readOwnKey)<Row>(spec, forceDescending);

describe("createSortSpecComparator", () => {
    it("reads every descriptor key through the injected resolver", () => {
        const seen: string[] = [];
        const comparator = createSortSpecComparator((item, key) => {
            seen.push(key);

            return readOwnKey(item, key);
        })<Row>("age", false);

        expect(comparator({ age: 2 }, { age: 10 })).toBe(-1);
        expect(seen).toEqual(["age", "age"]);
    });

    it("treats true, 'asc', 'Ascending' and an omitted direction as ascending", () => {
        // PHP-verified: docs/php-parity/task-18-sort-comparator.json,
        // "direction tuple [age,"asc"] — string form" and
        // "direction tuple [age,SortDirection::Ascending]".
        for (const spec of [
            "age",
            ["age"],
            ["age", true],
            ["age", "asc"],
            ["age", "Ascending"],
        ] as SortSpec<Row>[]) {
            expect(comparatorFor(spec)({ age: 2 }, { age: 10 })).toBe(-1);
        }
    });

    it("treats every other direction as descending", () => {
        // PHP-verified: docs/php-parity/task-10-pluck-sort.json, "direction
        // tuple [age,"desc"] — string form" and "direction tuple [age,"BOGUS"]
        // — default arm is DESCENDING".
        for (const spec of [
            ["age", false],
            ["age", "desc"],
            ["age", "Descending"],
            ["age", "BOGUS"],
        ] as SortSpec<Row>[]) {
            expect(comparatorFor(spec)({ age: 2 }, { age: 10 })).toBe(1);
        }
    });

    it("lets forceDescending override an explicit ascending direction", () => {
        // PHP-verified: docs/php-parity/task-18-sort-comparator.json,
        // "sortDesc overrides an explicit "asc" direction".
        expect(
            comparatorFor(["age", "asc"], true)({ age: 2 }, { age: 10 }),
        ).toBe(1);
    });

    it("returns a comparator descriptor untouched, even under forceDescending", () => {
        // Collection.php:1643 runs a callable descriptor as authored; the
        // sortByDesc rewrite only ever touches a comparison's [1] slot.
        const byAge = (a: Row, b: Row) => a.age - b.age;

        expect(comparatorFor(byAge, true)).toBe(byAge);
    });
});
