import { isArray, isNull, isObject, isUndefined } from "@tolki/utils";

import { getNestedValue } from "./path";

/**
 * Get the values a pluck wildcard segment iterates over, mirroring
 * `data_get()`'s `is_iterable()` check (`helpers.php:90-94`): a PHP
 * `foreach` walks both arrays and associative arrays, so both a JS array
 * and a plain object count here — deliberately not `getAccessibleValues`,
 * which only expands arrays.
 *
 * @param target - The value a `*` segment is expanding; callers bail to
 * `null` before this runs for anything that isn't an array or an object.
 * @returns The values to recurse into.
 */
export function getPluckWildcardValues(
    target: unknown[] | Record<PropertyKey, unknown>,
): unknown[] {
    if (isArray(target)) {
        return target;
    }

    return Object.values(target);
}

/**
 * Resolve a pluck path against a single item, expanding `*` segments into an
 * array of the values found at that level. Covers the `data_get()` wildcard
 * behaviour that Laravel's `Arr::pluck` tests exercise, with one known
 * divergence on inputs `ArrTest.php` never reaches: multiple wildcards nest
 * (`[[..], [..]]`) where `data_get` collapses the tail one level
 * (`Arr::collapse`). Align this before building `data_get`-equivalent
 * helpers on top of it.
 *
 * @param item - The item to resolve the path against.
 * @param segments - The already-split path segments.
 * @returns The resolved value, an array of values for a wildcard, or null.
 */
export function resolvePluckPath(
    item: unknown,
    segments: readonly string[],
): unknown {
    if (segments.length === 0) {
        return item;
    }

    const [segment, ...rest] = segments;

    if (segment === "*") {
        if (!isArray(item) && !isObject(item)) {
            return null;
        }

        return getPluckWildcardValues(item).map((value) =>
            resolvePluckPath(value, rest),
        );
    }

    if (isNull(item) || isUndefined(item)) {
        return null;
    }

    const next = getNestedValue(item, segment as string);

    if (isUndefined(next)) {
        return null;
    }

    return resolvePluckPath(next, rest);
}

/**
 * Split a pluck value or key argument into path segments the way Laravel's
 * `explodePluckParameters` does: strings split on dots, arrays pass
 * through, and `null` (the "keep the whole item" value form) yields no
 * segments at all so {@linkcode resolvePluckPath} returns the item itself —
 * `data_get($item, null)` short-circuits to `$target` before ever touching
 * a segment loop, and zero segments has the same effect here.
 *
 * @param path - The path to split.
 * @returns The path segments.
 */
export function explodePluckPath(
    path: string | readonly string[] | null,
): string[] {
    if (isNull(path)) {
        return [];
    }

    if (isArray(path)) {
        return [...path];
    }

    return String(path).split(".");
}
