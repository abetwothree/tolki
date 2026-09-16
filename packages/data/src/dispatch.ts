import { wrap as arrWrap } from "@tolki/arr";
import { from as objFrom } from "@tolki/obj";
import {
    isArray,
    isIterable,
    isMap,
    isObject,
    isUndefined,
} from "@tolki/utils";

type AnyFn = (...args: never[]) => unknown;

/**
 * The row that tells the type system what `toKeyedData` does to a Map.
 *
 * A conditional over an overloaded function resolves its last overload only, so this
 * answers with `objFn`'s widest row — the one row guaranteed to hold for any record.
 */
type KeyedMapRow<TObjFn extends AnyFn> = TObjFn extends (
    data: never,
    ...rest: infer TRest
) => infer TReturn
    ? (data: ReadonlyMap<PropertyKey, unknown>, ...rest: TRest) => TReturn
    : never;

/**
 * Determine whether the given data carries its own keys.
 *
 * Plain objects and Maps are the JavaScript equivalents of a PHP associative
 * array and are handled by the object helpers. Arrays, generators, Sets and
 * scalars are positional and are handled by the array helpers.
 *
 * @param data - The data to inspect.
 * @returns True when the data should be handled as keyed data.
 */
export function isKeyedData(data: unknown): boolean {
    if (isMap(data)) {
        return true;
    }

    return isObject(data) && !isIterable(data);
}

/**
 * Normalize keyed data into the plain object the object helpers walk.
 *
 * @param data - The keyed data to normalize.
 * @returns The data itself when it is already a plain object, otherwise a record built from it.
 */
export function toKeyedData<TKey extends PropertyKey, TValue>(
    data: unknown,
): Record<TKey, TValue> {
    // Most obj helpers walk with Object.entries, which yields nothing for a Map, so one has
    // to become a record first. That record cannot hold an out-of-order integer key, so the
    // four helpers that read a Map themselves take `keepKeyedData` instead.
    return (isMap(data) ? objFrom(data) : data) as Record<TKey, TValue>;
}

/**
 * Hand keyed data to the object helper exactly as it arrived.
 *
 * `obj.first`, `obj.last`, `obj.every` and `obj.some` read a Map's own entries, so they are
 * the only helpers that can see the insertion order a record loses: `{2: "c", 0: "a"}` always
 * iterates `0` first, while PHP's `[2 => 'c', 0 => 'a']` keeps the order it was written in.
 *
 * @param data - The keyed data to pass along.
 * @returns The data itself, converted by nothing.
 */
export function keepKeyedData(data: unknown): unknown {
    return data;
}

/**
 * STREAMS a positional backing: an iterable is handed on UNREAD, so an infinite generator
 * still works. The opposite of `toPositionalBacking`, which materializes.
 *
 * @param data - The data to normalize.
 * @returns The data itself when it is already iterable, otherwise it wrapped in an array.
 */
export function streamPositionalData<TValue>(data: unknown): Iterable<TValue> {
    if (isIterable<TValue>(data)) {
        return data;
    }

    // Missing data holds nothing to walk, so it is treated like null rather
    // than becoming a single undefined item
    if (isUndefined(data)) {
        return [];
    }

    // Widen: `data` is `unknown` here on purpose (it comes from a runtime
    // isIterable/isUndefined check, not a static narrowing), so `arrWrap`
    // has nothing to infer `TValue` from without this hint.
    return arrWrap(data as TValue);
}

/**
 * MATERIALIZES a positional backing: a Set or generator is read to exhaustion into a list.
 * The opposite of `streamPositionalData`, which hands an iterable on unread.
 *
 * @remarks A Set or generator backing answers with its materialized elements at runtime, but is
 * still typed from obj's widest row, because a Set is an object and lands there.
 *
 * Materializing reads to exhaustion, the way Laravel's `iterator_to_array` does: an infinite
 * generator exhausts memory, and a finite one is consumed, so a second call sees an empty backing.
 * An unbounded or single-use backing must go through `dataFirst`, `dataLast`, `dataEvery` or
 * `dataSome`, which pass `streamPositionalData` and hand the backing on unread.
 *
 * @param data - The data to normalize.
 * @returns The elements of a materializable iterable, otherwise the data wrapped in a list.
 */
export function toPositionalBacking(data: unknown): unknown {
    // Laravel materializes a Traversable, so a Set or generator arrives as its elements. An array
    // is ALIASED instead, since the mutating helpers write through it; a string is not iterable
    // here; and the Map guard is defensive only — dispatch sends a Map to obj before this runs.
    if (isIterable(data) && !isArray(data) && !isMap(data)) {
        return [...data];
    }

    return arrWrap(data);
}

/**
 * Build a function that forwards to an array helper or an object helper, keeping both signatures.
 *
 * @param arrFn - The `@tolki/arr` helper, used for a list backing. It must be the first operand:
 *                arr's rows are array-shaped, so keyed data falls through them to `objFn`.
 * @param objFn - The `@tolki/obj` helper, used for a keyed backing.
 * @param toPositional - How a non-keyed backing reaches `arrFn`.
 * @param toKeyed - How a keyed backing reaches `objFn`.
 * @returns A function carrying both helpers' overloads, behind the Map row.
 */
// The Map row must stay FIRST in the intersection: TS tries constituents left to right, and
// either delegate's own rows claim a Map before it, answering a type the runtime never returns.
// Measured: moving it last fails 48 type assertions across 11 files in this package.
export function dispatch<TArrFn extends AnyFn, TObjFn extends AnyFn>(
    arrFn: TArrFn,
    objFn: TObjFn,
    // A streaming helper must pass a Set or generator through UNREAD, so that an infinite
    // generator still works; those helpers override this with streamPositionalData.
    toPositional: (data: unknown) => unknown = toPositionalBacking,
    // An objFn that reads a Map itself must be handed the Map, or the record it would be
    // converted to re-sorts the integer keys; those helpers override this with keepKeyedData.
    toKeyed: (data: unknown) => unknown = toKeyedData,
): KeyedMapRow<TObjFn> & TArrFn & TObjFn {
    const forward = (data: unknown, ...rest: readonly unknown[]): unknown => {
        const keyed = isKeyedData(data);
        const target = keyed ? objFn : arrFn;

        return (target as unknown as (...args: readonly unknown[]) => unknown)(
            keyed ? toKeyed(data) : toPositional(data),
            ...rest,
        );
    };

    // The intersection is the point: it re-runs overload resolution per call site,
    // which is the only construct that forwards an overloaded delegate's return type.
    return forward as unknown as KeyedMapRow<TObjFn> & TArrFn & TObjFn;
}
