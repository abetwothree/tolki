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
    // Only `obj.from` accepts a Map; every other obj helper walks with Object.entries,
    // which yields nothing for one, so a Map must become a record before it is delegated.
    return (isMap(data) ? objFrom(data) : data) as Record<TKey, TValue>;
}

/**
 * Normalize data into something the array helpers can iterate over.
 *
 * @param data - The data to normalize.
 * @returns The data itself when it is already iterable, otherwise it wrapped in an array.
 */
export function toPositionalData<TValue>(data: unknown): Iterable<TValue> {
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
 * Normalize a positional backing into what the array helpers walk.
 *
 * @param data - The data to normalize.
 * @returns The elements of a materializable iterable, otherwise the data wrapped in a list.
 */
export function toPositionalBacking(data: unknown): unknown {
    // Laravel materializes a Traversable backing, so a Set or generator must arrive as its
    // elements rather than as one item. An array is already positional and is ALIASED, since
    // the mutating helpers write through it; a string is not iterable here, so it stays wrapped.
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
 * @returns A function carrying both helpers' overloads, behind the Map row.
 */
export function dispatch<TArrFn extends AnyFn, TObjFn extends AnyFn>(
    arrFn: TArrFn,
    objFn: TObjFn,
    // A streaming helper must pass a Set or generator through UNREAD, so that an infinite
    // generator still works; those helpers override this with toPositionalData.
    toPositional: (data: unknown) => unknown = toPositionalBacking,
): KeyedMapRow<TObjFn> & TArrFn & TObjFn {
    const forward = (data: unknown, ...rest: readonly unknown[]): unknown => {
        const keyed = isKeyedData(data);
        const target = keyed ? objFn : arrFn;

        return (target as unknown as (...args: readonly unknown[]) => unknown)(
            keyed ? toKeyedData(data) : toPositional(data),
            ...rest,
        );
    };

    // The intersection is the point: it re-runs overload resolution per call site,
    // which is the only construct that forwards an overloaded delegate's return type.
    return forward as unknown as KeyedMapRow<TObjFn> & TArrFn & TObjFn;
}
