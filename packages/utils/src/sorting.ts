import type { PathKey, SortSpec } from "@tolki/types";

import { compareValues } from "./equality";
import {
    isArray,
    isBoolean,
    isFiniteNumber,
    isFunction,
    isUndefined,
} from "./guards";

/**
 * Reads the value a sort descriptor's key names on one item.
 *
 * @param item - The item being sorted.
 * @param key - The descriptor's key path.
 * @returns The value to compare.
 */
export type SortValueResolver = (item: unknown, key: PathKey) => unknown;

/**
 * Build the sort-descriptor comparator factory for one path resolver.
 *
 * `@tolki/utils` sits below every path package, so the caller supplies the
 * resolver: `getNestedValue` for `Arr`/`Obj`, a `data_get` reader for `Collection`.
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

        // Collection::sortByMany reads [0] off Arr::wrap($comparison) and then
        // tests is_callable, so a comparator nested in a one-element descriptor
        // is still a comparator, never a key path.
        if (isArray(spec) && isFunction(spec[0])) {
            return spec[0] as (a: TValue, b: TValue) => number;
        }

        const [key, direction] = isArray(spec)
            ? (spec as readonly [
                  PathKey,
                  (boolean | "Ascending" | "Descending" | "asc" | "desc")?,
              ])
            : ([spec as PathKey, undefined] as const);

        // The direction comes through Arr::get($comparison, 1, true), so a
        // missing one is ascending and anything unrecognised is descending.
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

/**
 * Read a comparator's answers as PHP's `usort()`, `uasort()` and `uksort()` read them, for `Array.prototype.sort`.
 *
 * A number is cast to an int, so a fraction below 1 ties. A bool is deprecated in PHP 8 but still sorts: `true` is 1,
 * and `false` asks again with the operands swapped, where `true` is -1.
 *
 * @param compare - A comparator of two items, answering a number or a bool
 * @returns A comparator answering -1, 0 or 1
 *
 * @example
 * [3, 1, 2].sort(phpSortComparator((a, b) => a > b)); -> [1, 2, 3]
 * [3, 1, 2].sort(phpSortComparator((a, b) => (a - b) / 10)); -> [3, 1, 2]
 */
export function phpSortComparator<TValue>(
    compare: (a: TValue, b: TValue) => unknown,
): (a: TValue, b: TValue) => number {
    return (a, b) => {
        const answer = compare(a, b);

        if (answer === false) {
            return -comparatorSign(compare(b, a));
        }

        return comparatorSign(answer);
    };
}

/**
 * The sign of a comparator's answer once PHP casts it to an int.
 *
 * @param answer - The comparator's answer
 * @returns 1 for true or a number of 1 or more, -1 for one of -1 or less, else 0, NAN and the infinities included
 */
function comparatorSign(answer: unknown): number {
    if (isBoolean(answer)) {
        return answer ? 1 : 0;
    }

    return isFiniteNumber(answer) ? Math.sign(Math.trunc(answer)) : 0;
}
