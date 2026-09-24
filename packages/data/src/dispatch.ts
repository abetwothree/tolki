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
 * The row that types a Map backing: `objFn`'s widest row, for a Map of any key type.
 *
 * A conditional over an overloaded function resolves its last overload only, the widest. It takes every Map, so one
 * keyed by booleans or objects cannot fall through to a delegate row describing a result the helper never returns.
 */
type KeyedMapRow<TObjFn extends AnyFn> = TObjFn extends (
    data: never,
    ...rest: infer TRest
) => infer TReturn
    ? (data: ReadonlyMap<unknown, unknown>, ...rest: TRest) => TReturn
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
 * Normalize keyed data into the plain object an object helper addresses by key.
 *
 * A Map becomes the record `obj.from` builds, integer-like keys first, so only a by-path helper or one whose answer
 * ignores entry order takes this. A `...Using` callback runs in the record's order; PHP's follows its sort anyway.
 *
 * @param data - The keyed data to normalize.
 * @returns The data itself when it is already a plain object, otherwise a record built from it.
 */
export function toKeyedData<TKey extends PropertyKey, TValue>(
    data: unknown,
): Record<TKey, TValue> {
    return (isMap(data) ? objFrom(data) : data) as Record<TKey, TValue>;
}

/**
 * Hand keyed data to the object helper exactly as it arrived. This is dispatch's default.
 *
 * Only a Map keeps a PHP array's out-of-sequence integer keys in order: `{2: "c", 0: "a"}` iterates `0` first,
 * while PHP's `[2 => 'c', 0 => 'a']` iterates as written.
 *
 * @param data - The keyed data to pass along.
 * @returns The data itself, converted by nothing.
 */
export function keepKeyedData(data: unknown): unknown {
    return data;
}

/**
 * Hand a mutating object helper a copy of a Map, so the caller's Map is left as it was.
 *
 * `pop`, `shift`, `splice` and `unshift` write through a list or record; a Map is copied, as a Set or generator is.
 *
 * @param data - The keyed data to pass along.
 * @returns A new Map holding a Map's entries, otherwise the data itself.
 */
export function copyKeyedData(data: unknown): unknown {
    return isMap(data) ? new Map(data) : data;
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
export function dispatch<TArrFn extends AnyFn, TObjFn extends AnyFn>(
    arrFn: TArrFn,
    objFn: TObjFn,
    // A streaming helper must pass a Set or generator through UNREAD, so that an infinite
    // generator still works; those helpers override this with streamPositionalData.
    toPositional: (data: unknown) => unknown = toPositionalBacking,
    // An objFn reads a Map in insertion order, so it gets the Map; a by-path or order-blind helper overrides this
    // with toKeyedData, and a mutator with copyKeyedData, so the caller's Map is never written.
    toKeyed: (data: unknown) => unknown = keepKeyedData,
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
