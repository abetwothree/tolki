import type { SortSpec } from "@tolki/types";

import { compareValues } from "./equality";
import { isArray, isFunction, isUndefined } from "./guards";

/**
 * Reads the value a sort descriptor's key names on one item.
 *
 * @param item - The item being sorted.
 * @param key - The descriptor's key path.
 * @returns The value to compare.
 */
export type SortValueResolver = (item: unknown, key: string) => unknown;

/**
 * Build the sort-descriptor comparator factory for one path resolver.
 *
 * `@tolki/utils` sits below every path package, so the caller supplies the
 * resolver: `getNestedValue` for `Arr`/`Obj`, `dataGet` for `Collection`.
 *
 * @param resolve - Reads a descriptor's key off an item.
 * @returns A function building the comparator one sort descriptor implies.
 */
export function createSortSpecComparator(resolve: SortValueResolver) {
    return function sortSpecComparator<TValue>(
        spec: SortSpec<TValue>,
        forceDescending: boolean,
    ): (a: TValue, b: TValue) => number {
        if (isFunction(spec)) {
            return spec as (a: TValue, b: TValue) => number;
        }

        const [key, direction] = isArray(spec)
            ? (spec as readonly [
                  string,
                  (boolean | "Ascending" | "Descending" | "asc" | "desc")?,
              ])
            : ([spec as string, undefined] as const);

        // Collection::sortByMany reads the direction through
        // Arr::get($comparison, 1, true), so a missing one is ascending and
        // anything unrecognised falls through to descending.
        const isAscending =
            isUndefined(direction) ||
            direction === true ||
            direction === "asc" ||
            direction === "Ascending";
        const isDescending = forceDescending || !isAscending;

        return (a, b) => {
            const comparison = compareValues(resolve(a, key), resolve(b, key));

            return isDescending ? -comparison : comparison;
        };
    };
}
