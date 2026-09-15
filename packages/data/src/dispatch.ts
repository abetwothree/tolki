import { wrap as arrWrap } from "@tolki/arr";
import { from as objFrom } from "@tolki/obj";
import { isIterable, isMap, isObject, isUndefined } from "@tolki/utils";

type AnyFn = (...args: never[]) => unknown;

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
 * Build a function that forwards to an array helper or an object helper, keeping both signatures.
 *
 * @param arrFn - The `@tolki/arr` helper, used for a list backing. It must be the first operand:
 *                arr's rows are array-shaped, so keyed data falls through them to `objFn`.
 * @param objFn - The `@tolki/obj` helper, used for a keyed backing.
 * @param toPositional - How a non-keyed backing reaches `arrFn`.
 * @returns A function carrying both helpers' overloads.
 */
export function dispatch<TArrFn extends AnyFn, TObjFn extends AnyFn>(
    arrFn: TArrFn,
    objFn: TObjFn,
    // An iterable-aware helper must pass a Set or generator through; `arrWrap` would
    // hand it on as a one-element list, so those helpers override this with toPositionalData.
    toPositional: (data: unknown) => unknown = arrWrap,
): TArrFn & TObjFn {
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
    return forward as unknown as TArrFn & TObjFn;
}
