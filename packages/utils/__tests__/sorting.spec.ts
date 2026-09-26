import type { PathKey, SortSpec } from "@tolki/types";
import { createSortSpecComparator, phpSortComparator } from "@tolki/utils";
import { describe, expect, it } from "vitest";

type Row = { age: number };

// Stands in for the resolvers the packages inject: getNestedValue in
// arr/obj, dataGet in collection.
const readOwnKey = (item: unknown, key: PathKey) =>
    (item as Record<string, unknown>)[key as string];

const comparatorFor = (spec: SortSpec<Row>, forceDescending = false) =>
    createSortSpecComparator(readOwnKey)<Row>(spec, forceDescending);

describe("createSortSpecComparator", () => {
    it("hands a comparator descriptor back as it is, answering the bool it gives", () => {
        const greater = (a: number, b: number) => a > b;

        // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sortBy-bool-comparator": PHP reads the
        // bool when uasort() gets it, so the descriptor's own answer passes through untouched
        expect(createSortSpecComparator(readOwnKey)(greater, false)).toBe(
            greater,
        );
        expect(
            createSortSpecComparator(readOwnKey)<number>(
                [greater] as never,
                false,
            )(2, 1),
        ).toBe(true);
    });

    it("reads every descriptor key through the injected resolver", () => {
        const seen: PathKey[] = [];
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
        // Collection.php:1656 runs a callable descriptor as authored; the
        // sortByDesc rewrite only ever touches a comparison's [1] slot.
        const byAge = (a: Row, b: Row) => a.age - b.age;

        expect(comparatorFor(byAge, true)).toBe(byAge);
    });

    it("unwraps a comparator nested in a one-element descriptor", () => {
        // PHP-verified: docs/php-parity/task-18-sort-comparator.json,
        // "sortBy treats [[fn]] and [fn] the same" — Arr::wrap leaves a bare
        // comparator and a one-element descriptor in the same shape.
        const byAge = (a: Row, b: Row) => a.age - b.age;

        expect(comparatorFor([byAge] as never, true)).toBe(byAge);
    });
});

describe("phpSortComparator", () => {
    it("sorts by a comparator answering a bool, as PHP's usort() falls back for one", () => {
        // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sort-bool-comparator"
        expect(
            [3, 1, 2].sort(phpSortComparator((a: number, b: number) => a > b)),
        ).toEqual([1, 2, 3]);
        expect(
            [3, 1, 2].sort(phpSortComparator((a: number, b: number) => a < b)),
        ).toEqual([3, 2, 1]);
        expect(
            [5, 3, 9, 1, 7, 2, 8].sort(
                phpSortComparator((a: number, b: number) => a > b),
            ),
        ).toEqual([1, 2, 3, 5, 7, 8, 9]);
        expect([3, 1, 2].sort(phpSortComparator(() => false))).toEqual([
            3, 1, 2,
        ]);
    });

    it("casts a number to an int, so a fraction below 1, NAN or an infinity ties", () => {
        // docs/php-parity/task-32-collection-release-readiness.json, "C32-G-sort-comparator-int-cast"
        expect(
            [3, 1, 2].sort(
                phpSortComparator((a: number, b: number) => (a - b) / 10),
            ),
        ).toEqual([3, 1, 2]);
        expect(
            [3, 1, 2].sort(
                phpSortComparator(
                    (a: number, b: number) => Math.sign(a - b) * Infinity,
                ),
            ),
        ).toEqual([3, 1, 2]);
        expect([3, 1, 2].sort(phpSortComparator(() => NaN))).toEqual([3, 1, 2]);
        // CollectionTest::testSortWithCallback
        expect(
            [5, 3, 1, 2, 4].sort(
                phpSortComparator((a: number, b: number) => a - b),
            ),
        ).toEqual([1, 2, 3, 4, 5]);
    });
});
