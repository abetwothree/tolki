import {
    isArray,
    isFunction,
    isMap,
    isNull,
    isNumber,
    isObject,
    isPhpFalsy,
    isPlainObject,
    isUndefined,
    keyedEntries,
    phpArrayKey,
} from "@tolki/utils";

/** What reading a segment answers when the target holds no such key. */
const absent = Symbol("absent");

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
    target:
        | unknown[]
        | Record<PropertyKey, unknown>
        | ReadonlyMap<unknown, unknown>,
): unknown[] {
    if (isArray(target)) {
        return target;
    }

    // A Map stands in for a PHP array, so a `*` walks one value per key PHP would store.
    if (isMap(target)) {
        return keyedEntries(target).map(([, value]) => value);
    }

    return Object.values(target);
}

/**
 * Resolve a pluck path against a single item the way `data_get` does.
 *
 * @param item - The item to resolve the path against.
 * @param segments - The already-split path segments, each read as one literal key.
 * @returns The resolved value, an array of values for a `*` segment, or null.
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
        const target = isEnumerable(item) ? item.all() : item;

        if (!isArray(target) && !isObject(target)) {
            return null;
        }

        // A second wildcard nests its values here, where PHP's data_get collapses them one level.
        return getPluckWildcardValues(target).map((value) =>
            resolvePluckPath(value, rest),
        );
    }

    const next = readSegment(item, segment as string);

    if (next === absent || isUndefined(next)) {
        return null;
    }

    return resolvePluckPath(next, rest);
}

/**
 * Determine whether a pluck path names a key at every segment, the way `data_has` does.
 *
 * @param item - The item to check the path against.
 * @param segments - The already-split path segments; none at all is no path, which `data_has` answers false for.
 * @returns True when every segment names a key the value before it holds.
 */
export function hasPluckPath(
    item: unknown,
    segments: readonly string[],
): boolean {
    if (segments.length === 0) {
        return false;
    }

    let target = item;

    for (const segment of segments) {
        target = readSegment(target, segment);

        if (target === absent) {
            return false;
        }
    }

    return true;
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

/**
 * Read one segment of a path out of a target, the way `data_get` and `data_has` step into it.
 *
 * @param target - The value to read the segment from.
 * @param segment - The key to read.
 * @returns The value under the key, or `absent` when the target holds no such key.
 */
function readSegment(target: unknown, segment: string): unknown {
    if (isArray(target)) {
        const index = phpArrayKey(segment);

        return isNumber(index) && Object.hasOwn(target, index)
            ? target[index]
            : absent;
    }

    if (!isObject(target)) {
        return absent;
    }

    // A Map stands in for a PHP array, so its key is cast as PHP casts one, and a stored null still exists.
    if (isMap(target)) {
        const key = String(phpArrayKey(segment));
        const entry = keyedEntries(target).find(
            ([entryKey]) => entryKey === key,
        );

        return entry ? entry[1] : absent;
    }

    // A miss reads no property, unlike data_get: JS cannot tell a public one from state such as a Collection's items.
    if (isArrayAccess(target)) {
        // An Enumerable answers with array_key_exists over its items, so an item holding null still exists.
        const exists = isEnumerable(target)
            ? readSegment(target.all(), segment) !== absent
            : !isPhpFalsy(target.offsetExists(segment));

        return exists ? target.offsetGet(segment) : absent;
    }

    return Object.hasOwn(target, segment) ? target[segment] : absent;
}

/**
 * Determine whether a value reads its entries through `offsetExists` and `offsetGet`, as PHP's ArrayAccess does.
 *
 * @param value - The value to test.
 * @returns True for an object other than a plain one with both methods; a plain object is data.
 */
function isArrayAccess(value: unknown): value is {
    offsetExists(offset: string): unknown;
    offsetGet(offset: string): unknown;
} {
    return (
        isObject(value) &&
        !isPlainObject(value) &&
        isFunction(value["offsetExists"]) &&
        isFunction(value["offsetGet"])
    );
}

/**
 * Determine whether a value hands out its items through `all()`, as a PHP Enumerable such as a Collection does.
 *
 * @param value - The value to test.
 * @returns True for an object other than a plain one with an `all` method; a plain object is data.
 */
function isEnumerable(value: unknown): value is { all(): unknown } {
    return isObject(value) && !isPlainObject(value) && isFunction(value["all"]);
}
