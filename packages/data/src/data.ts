import {
    add as arrAdd,
    arrayItem,
    boolean as arrBoolean,
    chunk as arrChunk,
    collapse as arrCollapse,
    combine as arrCombine,
    contains as arrContains,
    crossJoin as arrCrossJoin,
    diff as arrDiff,
    diffAssoc as arrDiffAssoc,
    divide as arrDivide,
    dot as arrDot,
    every as arrEvery,
    except as arrExcept,
    exceptValues as arrExceptValues,
    exists as arrExists,
    filter as arrFilter,
    first as arrFirst,
    flatten as arrFlatten,
    flip as arrFlip,
    float as arrFloat,
    forget as arrForget,
    from as arrFrom,
    get as arrGet,
    has as arrHas,
    hasAll as arrHasAll,
    hasAny as arrHasAny,
    integer as arrInteger,
    intersect as arrIntersect,
    intersectAssoc as arrIntersectAssoc,
    intersectAssocUsing as arrIntersectAssocUsing,
    intersectByKeys as arrIntersectByKeys,
    join as arrJoin,
    keyBy as arrKeyBy,
    keys as arrKeys,
    last as arrLast,
    map as arrMap,
    mapSpread as arrMapSpread,
    mapWithKeys as arrMapWithKeys,
    only as arrOnly,
    onlyValues as arrOnlyValues,
    pad as arrPad,
    partition as arrPartition,
    pluck as arrPluck,
    pop as arrPop,
    prepend as arrPrepend,
    prependKeysWith as arrPrependKeysWith,
    pull as arrPull,
    push as arrPush,
    query as arrQuery,
    random as arrRandom,
    reject as arrReject,
    replace as arrReplace,
    replaceRecursive as arrReplaceRecursive,
    reverse as arrReverse,
    select as arrSelect,
    set as arrSet,
    shift as arrShift,
    shuffle as arrShuffle,
    slice as arrSlice,
    sole as arrSole,
    some as arrSome,
    sort as arrSort,
    sortDesc as arrSortDesc,
    sortRecursive as arrSortRecursive,
    sortRecursiveDesc as arrSortRecursiveDesc,
    splice as arrSplice,
    string as arrString,
    take as arrTake,
    toCssClasses as arrToCssClasses,
    toCssStyles as arrToCssStyles,
    undot as arrUndot,
    union as arrUnion,
    unshift as arrUnshift,
    values as arrValues,
    where as arrWhere,
    whereNotNull as arrWhereNotNull,
    wrap as arrWrap,
} from "@tolki/arr";
import {
    add as objAdd,
    boolean as objBoolean,
    chunk as objChunk,
    collapse as objCollapse,
    combine as objCombine,
    contains as objContains,
    crossJoin as objCrossJoin,
    diff as objDiff,
    diffAssoc as objDiffAssoc,
    diffAssocUsing as objDiffAssocUsing,
    diffKeysUsing as objDiffKeysUsing,
    divide as objDivide,
    dot as objDot,
    every as objEvery,
    except as objExcept,
    exceptValues as objExceptValues,
    exists as objExists,
    filter as objFilter,
    first as objFirst,
    flatten as objFlatten,
    flip as objFlip,
    float as objFloat,
    forget as objForget,
    from as objFrom,
    get as objGet,
    has as objHas,
    hasAll as objHasAll,
    hasAny as objHasAny,
    integer as objInteger,
    intersect as objIntersect,
    intersectAssoc as objIntersectAssoc,
    intersectAssocUsing as objIntersectAssocUsing,
    intersectByKeys as objIntersectByKeys,
    join as objJoin,
    keyBy as objKeyBy,
    keys as objKeys,
    last as objLast,
    map as objMap,
    mapSpread as objMapSpread,
    mapWithKeys as objMapWithKeys,
    objectItem,
    only as objOnly,
    onlyValues as objOnlyValues,
    pad as objPad,
    partition as objPartition,
    pluck as objPluck,
    pop as objPop,
    prepend as objPrepend,
    prependKeysWith as objPrependKeysWith,
    pull as objPull,
    push as objPush,
    query as objQuery,
    random as objRandom,
    reject as objReject,
    replace as objReplace,
    replaceRecursive as objReplaceRecursive,
    reverse as objReverse,
    select as objSelect,
    set as objSet,
    shift as objShift,
    shuffle as objShuffle,
    slice as objSlice,
    sole as objSole,
    some as objSome,
    sort as objSort,
    sortDesc as objSortDesc,
    sortRecursive as objSortRecursive,
    sortRecursiveDesc as objSortRecursiveDesc,
    splice as objSplice,
    string as objString,
    take as objTake,
    toCssClasses as objToCssClasses,
    toCssStyles as objToCssStyles,
    undot as objUndot,
    union as objUnion,
    unshift as objUnshift,
    values as objValues,
    where as objWhere,
    whereNotNull as objWhereNotNull,
} from "@tolki/obj";
import type {
    AddToArray,
    AddToObject,
    DataItems,
    DataIterableItems,
    GetFieldType,
    PathKey,
    PathKeys,
    UnwrapFn,
} from "@tolki/types";
import {
    entriesKeyValue,
    isArray,
    isFunction,
    isIterable,
    isMap,
    isNull,
    isObject,
    isUndefined,
} from "@tolki/utils";

/**
 * A note on most of the `as` casts below: each function here dispatches a loose
 * `DataItems<TValue, TKey>` union to a stricter `@tolki/arr`/`@tolki/obj`
 * implementation via `isObject()`, which can't narrow the union's generics.
 * Widening happens at this dispatch boundary, not by loosening `obj`/`arr`'s own
 * return types. Some casts carry their own comment for a more specific reason.
 */

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
function isKeyedData(data: unknown): boolean {
    if (isMap(data)) {
        return true;
    }

    return isObject(data) && !isIterable(data);
}

/**
 * Normalize data into something the array helpers can iterate over.
 *
 * @param data - The data to normalize.
 * @returns The data itself when it is already iterable, otherwise it wrapped in an array.
 */
function toPositionalData<TValue>(data: unknown): Iterable<TValue> {
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
 * Add an element to data.
 *
 * Note: This function does not accept readonly arrays as they cannot be mutated.
 *
 * TODO: AddToObject should be converted to match the way the "add" functions work
 *
 * @param data - The data to add to
 * @param key - The key to add at
 * @param value - The value to add
 * @returns New data with the element added
 *
 * @example
 *
 * dataAdd([1, 2], 2, 3); -> [1, 2, 3]
 * dataAdd({a: 1}, 'b', 2); -> {a: 1, b: 2}
 */
// Overload: object
export function dataAdd<
    TValue extends Record<PropertyKey, unknown>,
    TKey extends PropertyKey,
    TNewValue,
>(
    data: TValue,
    key: TKey,
    value: TNewValue,
): AddToObject<TValue, TKey, TNewValue>;
// Overload: mutable array only (excludes readonly arrays)
export function dataAdd<TValue, TNewValue>(
    data: TValue[],
    key: number,
    value: TNewValue,
): AddToArray<TValue[], TNewValue>;
// Implementation
export function dataAdd<TValue>(
    data: DataItems<TValue, PropertyKey>,
    key: PathKey,
    value: unknown,
) {
    if (isObject(data)) {
        return objAdd(data, key, value);
    }

    return arrAdd(arrWrap(data), key, value);
}

/**
 * Get an item from data or return default value.
 *
 * @param data - The data to get from
 * @param key - The key to get
 * @param defaultValue - Default value if key doesn't exist
 * @returns The item value or default
 *
 * @example
 *
 * dataItem([['a', 'b'], ['c', 'd']], 0); -> ['a', 'b']
 * dataItem({items: ['x', 'y']}, 'items'); -> ['x', 'y']
 */
// Overload: no default value - return field type or never if path doesn't exist
export function dataItem<
    TValue extends Record<PropertyKey, unknown>,
    TPath extends string,
>(data: TValue, key: TPath): GetFieldType<TValue, TPath, never>;
// Overload: with default value - return field type if exists, otherwise unwrapped default
export function dataItem<
    TValue extends Record<PropertyKey, unknown>,
    TPath extends string,
    TDefault,
>(
    data: TValue,
    key: TPath,
    defaultValue: TDefault | null,
): GetFieldType<TValue, TPath, UnwrapFn<TDefault>>;
// Overload: with default value as a function
export function dataItem<
    TValue extends Record<PropertyKey, unknown>,
    TPath extends string,
    TDefault extends (...args: unknown[]) => unknown,
>(
    data: TValue,
    key: TPath,
    defaultValue: TDefault,
): GetFieldType<TValue, TPath, UnwrapFn<TDefault>>;
// Overload: array with no default
export function dataItem<TValue, TIndex extends number>(
    data: TValue[] | readonly TValue[],
    key: TIndex,
): GetFieldType<TValue[] | readonly TValue[], TIndex, never>;
// Overload: array with default
export function dataItem<TValue, TDefault>(
    data: TValue[] | readonly TValue[],
    key: number,
    defaultValue: TDefault | null,
): GetFieldType<TValue[] | readonly TValue[], number, UnwrapFn<TDefault>>;
// Overload: array with default as function
export function dataItem<
    TValue,
    TDefault extends (...args: unknown[]) => unknown,
>(
    data: TValue[] | readonly TValue[],
    key: number,
    defaultValue: TDefault,
): GetFieldType<TValue[] | readonly TValue[], number, UnwrapFn<TDefault>>;
// Implementation
export function dataItem<TValue, TDefault = null>(
    data: DataItems<TValue, PropertyKey> | readonly TValue[],
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
) {
    if (isObject(data)) {
        return objectItem(data, key, defaultValue);
    }

    return arrayItem(arrWrap(data), key, defaultValue);
}

/**
 * Get a boolean value from data.
 *
 * @param data - The data to get from
 * @param key - The key to get
 * @param defaultValue - Default boolean value
 * @returns Boolean value or default
 *
 * @example
 *
 * dataBoolean([true, false], 0, false); -> true
 * dataBoolean({active: true}, 'active', false); -> true
 */
export function dataBoolean<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    key: PathKey,
    defaultValue = false,
): boolean {
    if (isObject(data)) {
        return objBoolean(data, key, defaultValue);
    }

    return arrBoolean(arrWrap(data), key, defaultValue);
}

/**
 * Chunk the data into chunks of the given size.
 *
 * @param data - The data to chunk
 * @param size - The size of each chunk
 * @param preserveKeys - Whether to preserve the original keys, defaults to true
 * @returns Chunked data
 */
export function dataChunk<TValue extends Record<PropertyKey, unknown>>(
    data: TValue,
    size: number,
    preserveKeys?: boolean,
): ReturnType<typeof objChunk<TValue>>;
export function dataChunk<TValue>(
    data: TValue[],
    size: number,
    preserveKeys?: boolean,
): ReturnType<typeof arrChunk<TValue>>;
export function dataChunk<TValue>(
    data: DataItems<TValue, PropertyKey>,
    size: number,
    preserveKeys?: boolean,
) {
    if (isObject(data)) {
        if (preserveKeys === true) {
            return objChunk(data, size, true);
        } else if (preserveKeys === false) {
            return objChunk(data, size, false);
        } else {
            return objChunk(data, size);
        }
    }

    return arrChunk(arrWrap(data), size);
}

/**
 * Collapse nested data into a single level.
 *
 * @param data - The data to collapse
 * @returns Collapsed data
 *
 * @example
 *
 * dataCollapse([[1, 2], [3, 4]]); -> [1, 2, 3, 4]
 * dataCollapse({a: {x: 1, y: 2}, b: {z: 3}}); -> {x: 1, y: 2, z: 3}
 */
export function dataCollapse<TValue extends Record<PropertyKey, unknown>>(
    data: TValue,
): ReturnType<typeof objCollapse>;
export function dataCollapse<TValue>(
    data: TValue[],
): ReturnType<typeof arrCollapse>;
export function dataCollapse<TValue>(data: DataItems<TValue, PropertyKey>) {
    if (isObject(data)) {
        // Widen: objCollapse requires nested-record values, but the
        // dispatch signature's TValue is unconstrained (the overloads above
        // are what actually enforce the nested shape for callers).
        return objCollapse(
            data as Record<PropertyKey, Record<PropertyKey, TValue>>,
        );
    }

    return arrCollapse(arrWrap(data));
}

/**
 * Combine two data sets.
 *
 * @param itemsA - The first data set
 * @param itemsB - The second data set
 * @returns Combined data set
 */
export function dataCombine<
    TKeys extends Record<PropertyKey, unknown>,
    TValues extends Record<PropertyKey, unknown>,
>(
    itemsA: Record<PropertyKey, TKeys>,
    itemsB: Record<PropertyKey, TValues>,
): ReturnType<typeof objCombine>;
export function dataCombine<TKeys, TValues>(
    itemsA: TKeys[],
    itemsB: TValues[],
): ReturnType<typeof arrCombine>;
export function dataCombine<TKeys, TValues>(
    itemsA: Record<PropertyKey, TKeys>,
    itemsB: Record<PropertyKey, TValues>,
): ReturnType<typeof objCombine>;
export function dataCombine<TKeys, TValues>(
    itemsA: DataItems<TKeys>,
    itemsB: DataItems<TValues>,
) {
    if (isObject(itemsA) && isObject(itemsB)) {
        return objCombine(itemsA, itemsB);
    }

    if (isArray(itemsA) && isArray(itemsB)) {
        return arrCombine(itemsA, itemsB);
    }

    throw new Error(
        "dataCombine requires both itemsA and itemsB to be of the same type (both objects or both arrays).",
    );
}

/**
 * Count the number of items in data.
 *
 * @param data - the data to count
 * @returns The count of items in the object or array
 *
 * @example
 *
 * dataCount([1, 2, 3]); -> 3
 * dataCount({a: 1, b: 2}); -> 2
 */
export function dataCount<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
): number {
    return Object.values(data).length;
}

/**
 * Cross join data with other data.
 *
 * @param data - The data to cross join
 * @param others - Other data to join with
 * @returns Cross joined data
 *
 * @example
 *
 * dataCrossJoin([1, 2], [3, 4]); -> [[1, 3], [1, 4], [2, 3], [2, 4]]
 */
export function dataCrossJoin(data: unknown, ...others: unknown[]): unknown[] {
    // Widen (both branches): `dataCrossJoin` has no generics; only `data` is
    // runtime-checked, `others` is trusted to share its shape, exactly as
    // PHP's `Arr::crossJoin()` trusts its variadic arguments to all be arrays.
    if (isObject(data)) {
        // For objects, convert to format expected by objCrossJoin
        const objData = data as Record<string, readonly unknown[]>;
        const objOthers = others.map(
            (other) => other as Record<string, readonly unknown[]>,
        );
        return objCrossJoin(objData, ...objOthers);
    }

    // For arrays
    return arrCrossJoin(arrWrap(data) as unknown[], ...(others as unknown[][]));
}

/**
 * Divide data into keys and values.
 *
 * @param data - The data to divide
 * @returns Array with keys and values
 *
 * @example
 *
 * dataDivide([1, 2, 3]); -> [[0, 1, 2], [1, 2, 3]]
 * dataDivide({a: 1, b: 2}); -> [['a', 'b'], [1, 2]]
 */
export function dataDivide<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
): [unknown[], unknown[]] {
    if (isObject(data)) {
        return objDivide(data);
    }

    return arrDivide(arrWrap(data));
}

/**
 * Convert data to dot notation.
 *
 * @param data - The data to convert
 * @param prepend - String to prepend to keys
 * @param depth - Maximum depth to flatten. Defaults to Infinity.
 * @returns Data in dot notation
 *
 * @example
 *
 * dataDot({a: {b: 1, c: 2}}); -> {'a.b': 1, 'a.c': 2}
 */
export function dataDot<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    prepend = "",
    depth: number = Infinity,
): Record<string, unknown> {
    if (isObject(data)) {
        return objDot(data, prepend, depth);
    }

    return arrDot(arrWrap(data), prepend, depth);
}

/**
 * Convert dot notation back to nested data.
 *
 * @param data - The dot notation data object to convert
 * @param asArray - Force array-shaped rebuilding (`Arr.undot`) instead of the
 *   object-shaped one. JS-only ergonomics with no PHP counterpart; throws if any
 *   key's dot segments aren't all non-negative integers.
 * @returns Nested data structure
 * @throws TypeError via `Arr.undot` when `asArray` is set and a key is not an index path.
 *
 * @example
 *
 * dataUndot({'a.b': 1, 'a.c': 2}); -> {a: {b: 1, c: 2}}
 */
export function dataUndot<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    asArray: boolean = false,
): DataItems<TValue, TKey> {
    if (isObject(data) && !asArray) {
        return objUndot(data);
    }

    // Widen: `asArray` routes object-backed data to `Arr.undot`, which rejects
    // non-numeric-first keys — `dataUndot`'s own contract is broader; `Arr.undot`'s
    // runtime guard is what catches a bad key instead.
    return arrUndot(data as Record<TKey, TValue>) as DataItems<TValue>;
}

/**
 * Union multiple objects or arrays items into one. Can only union items of the same type.
 *
 * @param items - the data items to union
 * @return A new object or array containing all values
 */
export function dataUnion<TValue>(
    ...items: (TValue[] | Record<PropertyKey, TValue> | null | undefined)[]
) {
    // A nullish operand is `(array) null` in PHP — empty, and no evidence
    // either way about the backing the rest of the operands share.
    const present = items.filter(
        (item) => !isNull(item) && !isUndefined(item),
    ) as (TValue[] | Record<PropertyKey, TValue>)[];

    if (present.every(isObject)) {
        return objUnion(...present);
    }

    if (present.every(isArray)) {
        return arrUnion(...(present as TValue[][]));
    }

    throw new Error(
        "dataUnion requires all provided items to be of the same type (all objects or all arrays).",
    );
}

/**
 * Get all data except specified keys.
 *
 * @param data - The source data
 * @param keys - Keys to exclude
 * @returns Data without specified keys
 *
 * @example
 *
 * dataExcept([1, 2, 3, 4], [1, 3]); -> [1, 3] (indices 0 and 2)
 * dataExcept({a: 1, b: 2, c: 3}, ['b']); -> {a: 1, c: 3}
 */
export function dataExcept<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    keys: PathKeys,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objExcept(
            data as Record<TKey, TValue>,
            keys as string[],
        ) as DataItems<TValue, TKey>;
    }

    return arrExcept(arrWrap(data), keys as number[]) as DataItems<TValue>;
}

/**
 * Get all data except for specified values.
 *
 * @param data - The data to filter
 * @param values - The values to exclude
 * @param strict - Whether to use strict comparison
 * @returns Data without specified values
 *
 * @example
 *
 * dataExceptValues(['foo', 'bar', 'baz'], ['foo', 'baz']); -> [1 => 'bar']
 * dataExceptValues({name: 'taylor', age: 26}, [26]); -> {name: 'taylor'}
 */
export function dataExceptValues<
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(
    data: DataItems<TValue, TKey>,
    values: TValue | TValue[],
    strict: boolean = false,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objExceptValues(data, values, strict);
    }

    return arrExceptValues(data, values, strict);
}

/**
 * Check if a key exists in data.
 *
 * @param data - The data to check
 * @param key - The key to check for
 * @returns True if key exists
 *
 * @example
 *
 * dataExists([1, 2, 3], 1); -> true
 * dataExists({a: 1, b: 2}, 'c'); -> false
 */
export function dataExists<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    key: PathKey,
): boolean {
    if (isObject(data)) {
        return objExists(data, key);
    }

    return arrExists(arrWrap(data), key);
}

/**
 * Take a limited number of items from data.
 *
 * @param data - The data to take from
 * @param limit - Number of items to take
 * @returns Limited data
 *
 * @example
 *
 * dataTake([1, 2, 3, 4, 5], 3); -> [1, 2, 3]
 * dataTake({a: 1, b: 2, c: 3, d: 4}, 2); -> {a: 1, b: 2}
 */
export function dataTake<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    limit: number,
): DataItems<TValue, TKey> | DataItems<TValue> {
    if (isObject(data)) {
        return objTake(data as Record<TKey, TValue>, limit) as DataItems<
            TValue,
            TKey
        >;
    }

    return arrTake(arrWrap(data), limit) as DataItems<TValue>;
}

/**
 * Flatten nested data to a specified depth.
 *
 * @param data - The data to flatten
 * @param depth - The depth to flatten to
 * @returns Flattened data
 *
 * @example
 *
 * dataFlatten([[1, 2], [3, [4, 5]]], 1); -> [1, 2, 3, [4, 5]]
 * dataFlatten({a: {b: {c: 1}}}, 1); -> {'a.b': {c: 1}}
 */
export function dataFlatten<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    depth: number = Infinity,
) {
    if (isObject(data)) {
        return objFlatten(data, depth);
    }

    return arrFlatten(arrWrap(data), depth);
}

/**
 * Flip the keys and values of an object or array.
 *
 * @param data - The data of items to flip
 * @return - the data items flipped
 */
export function dataFlip<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
) {
    if (isObject(data)) {
        return objFlip(data);
    }

    return arrFlip(arrWrap(data));
}

/**
 * Get a float value from data.
 *
 * @param data - The data to get from
 * @param key - The key to get
 * @param defaultValue - Default float value
 * @returns Float value or default
 *
 * @example
 *
 * dataFloat([1.5, 2.7], 0, 0.0); -> 1.5
 * dataFloat({price: 9.99}, 'price', 0.0); -> 9.99
 */
export function dataFloat<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    key: PathKey,
    defaultValue = 0.0,
): number {
    if (isObject(data)) {
        return objFloat(data, key, defaultValue);
    }

    return arrFloat(arrWrap(data), key, defaultValue);
}

/**
 * Remove keys from data.
 *
 * @param data - The data to remove from
 * @param keys - Keys to remove
 * @returns Data with keys removed
 *
 * @example
 *
 * dataForget([1, 2, 3, 4], [1, 3]); -> [1, 3] (removes indices 1 and 3)
 * dataForget({a: 1, b: 2, c: 3}, ['b']); -> {a: 1, c: 3}
 */
export function dataForget<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    keys: PathKeys,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objForget(
            data as Record<TKey, TValue>,
            keys as string[],
        ) as DataItems<TValue, TKey>;
    }

    return arrForget(arrWrap(data), keys as number[]) as DataItems<TValue>;
}

/**
 * Create data from various item types.
 *
 * @param items - The items to create data from
 * @returns Data created from items
 *
 * @example
 *
 * dataFrom([1, 2, 3]); -> [1, 2, 3]
 * dataFrom({a: 1, b: 2}); -> {a: 1, b: 2}
 * dataFrom(new Map([['a', 1]])); -> {a: 1}
 * dataFrom(new Set([1, 2])); -> [1, 2]
 */
export function dataFrom(items: unknown): unknown[] | Record<string, unknown> {
    if (isKeyedData(items)) {
        return objFrom(items as Record<string, unknown>);
    }

    // arrFrom expects the items to be convertible to an array
    return arrFrom(items as object);
}

/**
 * Get a value from data by key.
 *
 * @param data - The data to get from
 * @param key - The key to get
 * @param defaultValue - Default value if key doesn't exist
 * @returns The value or default
 *
 * @example
 *
 * dataGet([1, 2, 3], 1, 'default'); -> 2
 * dataGet({a: 1, b: 2}, 'c', 'default'); -> 'default'
 */
export function dataGet<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TGetDefault = null,
>(
    data: DataItems<TValue, TKey>,
    key: PathKey,
    defaultValue?: TGetDefault | (() => TGetDefault),
): TValue | TGetDefault | null {
    if (isObject(data)) {
        return objGet(
            data as Record<TKey, TValue>,
            key as string,
            defaultValue,
        );
    }

    return arrGet(arrWrap(data), key as number, defaultValue) as
        | TValue
        | TGetDefault
        | null;
}

/**
 * Check if data has specified keys.
 *
 * @param data - The data to check
 * @param keys - Keys to check for
 * @returns True if has keys
 *
 * @example
 *
 * dataHas([1, 2, 3], [0, 1]); -> true
 * dataHas({a: 1, b: 2}, ['a', 'c']); -> false
 */
export function dataHas<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    keys: PathKeys,
): boolean {
    if (isObject(data)) {
        return objHas(data, keys);
    }

    return arrHas(arrWrap(data), keys);
}

/**
 * Check if data has all specified keys.
 *
 * @param data - The data to check
 * @param keys - Keys to check for
 * @returns True if has all keys
 *
 * @example
 *
 * dataHasAll([1, 2, 3], [0, 1]); -> true
 * dataHasAll({a: 1, b: 2}, ['a', 'c']); -> false
 */
export function dataHasAll<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    keys: PathKeys,
): boolean {
    if (isObject(data)) {
        return objHasAll(data, keys);
    }

    return arrHasAll(arrWrap(data), keys);
}

/**
 * Check if data has any of the specified keys.
 *
 * @param data - The data to check
 * @param keys - Keys to check for
 * @returns True if has any keys
 *
 * @example
 *
 * dataHasAny([1, 2, 3], [0, 5]); -> true
 * dataHasAny({a: 1, b: 2}, ['c', 'd']); -> false
 */
export function dataHasAny<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    keys: PathKeys,
): boolean {
    if (isObject(data)) {
        return objHasAny(data, keys);
    }

    return arrHasAny(arrWrap(data), keys);
}

/**
 * Test if every item in data passes a test.
 *
 * @param data - The data to test
 * @param callback - The test function
 * @returns True if every item passes
 *
 * @example
 *
 * dataEvery([2, 4, 6], (value) => value % 2 === 0); -> true
 * dataEvery({a: 2, b: 4}, (value) => value % 2 === 0); -> true
 * dataEvery(new Map([['a', 2]]), (value) => value % 2 === 0); -> true
 * dataEvery(new Set([2, 4]), (value) => value % 2 === 0); -> true
 */
// Overload: Map, keyed by its own keys
export function dataEvery<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Map<TKey, TValue>,
    callback: (value: TValue, key: TKey) => boolean,
): boolean;
// Overload: array or any other iterable, keyed by position
export function dataEvery<TValue>(
    data: TValue[] | Iterable<TValue>,
    callback: (value: TValue, key: number) => boolean,
): boolean;
// Overload: object and general fallback
export function dataEvery<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataIterableItems<TValue, TKey>,
    callback: (value: TValue, key: TKey) => boolean,
): boolean;
// Implementation
export function dataEvery<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataIterableItems<TValue, TKey>,
    callback: (value: TValue, key: TKey) => boolean,
): boolean {
    if (isKeyedData(data)) {
        return objEvery(
            data as Record<TKey, TValue>,
            callback as (value: TValue, key: TKey) => boolean,
        );
    }

    return arrEvery(
        toPositionalData<TValue>(data),
        callback as (value: TValue, index: number) => boolean,
    );
}

/**
 * Test if some items in data pass a test.
 *
 * @param data - The data to test
 * @param callback - The test function
 * @returns True if some items pass
 *
 * @example
 *
 * dataSome([1, 2, 3], (value) => value > 2); -> true
 * dataSome({a: 1, b: 2}, (value) => value > 2); -> false
 * dataSome(new Map([['a', 1], ['b', 3]]), (value) => value > 2); -> true
 * dataSome(new Set([1, 3]), (value) => value > 2); -> true
 */
// Overload: Map, keyed by its own keys
export function dataSome<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Map<TKey, TValue>,
    callback: (value: TValue, key: TKey) => boolean,
): boolean;
// Overload: array or any other iterable, keyed by position
export function dataSome<TValue>(
    data: TValue[] | Iterable<TValue>,
    callback: (value: TValue, key: number) => boolean,
): boolean;
// Overload: object and general fallback
export function dataSome<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataIterableItems<TValue, TKey>,
    callback: (value: TValue, key: TKey) => boolean,
): boolean;
// Implementation
export function dataSome<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataIterableItems<TValue, TKey>,
    callback: (value: TValue, key: TKey) => boolean,
): boolean {
    if (isKeyedData(data)) {
        return objSome(
            data as Record<TKey, TValue>,
            callback as (value: TValue, key: TKey) => boolean,
        );
    }

    return arrSome(
        toPositionalData<TValue>(data),
        callback as (value: TValue, index: number) => boolean,
    );
}

/**
 * Get an integer value from data.
 *
 * @param data - The data to get from
 * @param key - The key to get
 * @param defaultValue - Default integer value
 * @returns Integer value or default
 *
 * @example
 *
 * dataInteger([1, 2, 3], 0, 0); -> 1
 * dataInteger({count: 42}, 'count', 0); -> 42
 */
export function dataInteger<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    key: PathKey,
    defaultValue = 0,
): number {
    if (isObject(data)) {
        return objInteger(data, key, defaultValue);
    }

    return arrInteger(arrWrap(data), key, defaultValue);
}

/**
 * Join data elements with a glue string.
 *
 * @param data - The data to join
 * @param glue - The glue string
 * @param finalGlue - The final glue string for the last item
 * @returns Joined string
 *
 * @example
 *
 * dataJoin([1, 2, 3], ', '); -> '1, 2, 3'
 * dataJoin(['a', 'b', 'c'], ', ', ' and '); -> 'a, b and c'
 */
export function dataJoin<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    glue: string,
    finalGlue = "",
): string {
    if (isObject(data)) {
        return objJoin(data, glue, finalGlue);
    }

    return arrJoin(arrWrap(data), glue, finalGlue);
}

/**
 * Key data by a given key or callback.
 *
 * @param data - The data to key
 * @param keyBy - Key or callback to key by
 * @returns Keyed data
 *
 * @example
 *
 * dataKeyBy([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}], 'id');
 * -> {1: {id: 1, name: 'John'}, 2: {id: 2, name: 'Jane'}}
 */
export function dataKeyBy(
    data: unknown,
    keyBy: string | ((item: unknown) => string | number | null | undefined),
): Record<string | number, unknown> {
    if (isObject(data)) {
        return objKeyBy(data, keyBy);
    }

    return arrKeyBy(arrWrap(data), keyBy);
}

/**
 * Prepend keys with a given prefix.
 *
 * @param data - The data to prepend keys to
 * @param prependWith - The prefix to prepend
 * @returns Data with prepended keys
 *
 * @example
 *
 * dataPrependKeysWith({name: 'John', age: 30}, 'user_');
 * -> {user_name: 'John', user_age: 30}
 */
export function dataPrependKeysWith<
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(data: DataItems<TValue, TKey>, prependWith: string): Record<string, TValue> {
    if (isObject(data)) {
        return objPrependKeysWith(data, prependWith);
    }

    return arrPrependKeysWith(arrWrap(data), prependWith);
}

/**
 * Get only specified keys from data.
 *
 * @param data - The data to get from
 * @param keys - Keys to include
 * @returns Data with only specified keys
 *
 * @example
 *
 * dataOnly([1, 2, 3, 4], [0, 2]); -> [1, 3]
 * dataOnly({a: 1, b: 2, c: 3}, ['a', 'c']); -> {a: 1, c: 3}
 */
export function dataOnly<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    keys: PathKey[],
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objOnly(
            data as Record<TKey, TValue>,
            keys as string[],
        ) as DataItems<TValue, TKey>;
    }

    return arrOnly(arrWrap(data), keys as number[]) as DataItems<TValue>;
}

/**
 * Get only items with specified values from data.
 *
 * @param data - The data to filter
 * @param values - The values to include
 * @param strict - Whether to use strict comparison
 * @returns Data with only specified values
 *
 * @example
 *
 * dataOnlyValues(['foo', 'bar', 'baz'], ['foo', 'baz']); -> [0 => 'foo', 2 => 'baz']
 * dataOnlyValues({name: 'taylor', age: 26}, [26]); -> {age: 26}
 */
export function dataOnlyValues<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    values: TValue | TValue[],
    strict: boolean = false,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objOnlyValues(data, values, strict);
    }

    return arrOnlyValues(data, values, strict);
}

/**
 * Select specific keys from data items.
 *
 * @param data - The data to select from
 * @param keys - Keys to select
 * @returns Selected data
 *
 * @example
 *
 * dataSelect([{a: 1, b: 2, c: 3}], ['a', 'c']); -> [{a: 1, c: 3}]
 */
export function dataSelect<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    keys: PathKey[] | PathKeys,
) {
    if (isObject(data)) {
        return objSelect(data, keys);
    }

    return arrSelect(arrWrap(data), keys);
}

/**
 * Map data with keys using a callback.
 *
 * @param data - The data to map
 * @param callback - The mapping callback
 * @returns Mapped data with keys
 *
 * @example
 *
 * dataMapWithKeys([1, 2], (value, index) => [`key_${String(index)}`, value * 2]);
 * -> {key_0: 2, key_1: 4}
 */
export function dataMapWithKeys<
    TValue,
    TMapWithKeysValue,
    TKey extends PropertyKey = PropertyKey,
    TMapWithKeysKey extends PropertyKey = PropertyKey,
>(
    data: DataItems<TValue, TKey>,
    callback: (
        value: TValue,
        key: TKey,
    ) =>
        | [TMapWithKeysKey, TMapWithKeysValue]
        | Record<TMapWithKeysKey, TMapWithKeysValue>,
): Record<TMapWithKeysKey, TMapWithKeysValue> {
    // The declared callback type permits either a `[key, value]` tuple or a
    // `Record<K, V>`. Both objMapWithKeys and arrMapWithKeys only understand
    // the Record form (they fold the result via `Object.entries`, which on
    // an actual tuple/array yields `{0: key, 1: value}` instead), so a tuple
    // return is normalized into a single-pair Record here, before either
    // branch, so the two paths can't drift out of sync on this again.
    const normalizedCallback = (
        value: TValue,
        key: TKey,
    ): Record<TMapWithKeysKey, TMapWithKeysValue> => {
        const mapped = callback(value, key);

        return isArray(mapped)
            ? ({ [mapped[0]]: mapped[1] } as Record<
                  TMapWithKeysKey,
                  TMapWithKeysValue
              >)
            : mapped;
    };

    if (isObject(data)) {
        return objMapWithKeys(
            data as Record<string, TValue>,
            normalizedCallback as (
                value: TValue,
                key: string,
            ) => Record<TMapWithKeysKey, TMapWithKeysValue>,
        );
    }

    return arrMapWithKeys(
        arrWrap(data) as TValue[],
        (value: TValue, index: number) =>
            normalizedCallback(value, index as TKey),
    ) as Record<TMapWithKeysKey, TMapWithKeysValue>;
}

/**
 * Map data by spreading array items to callback.
 *
 * @param data - The data to map
 * @param callback - The mapping callback
 * @returns Mapped data
 *
 * @example
 *
 * dataMapSpread([[1, 2], [3, 4]], (a, b) => a + b); -> [3, 7]
 */

// `any[]` here is intentional: `dataMapSpread` exists so callers can write a
// callback whose parameters are concrete types; `unknown[]` would reject that
// (TS2469/18046). Standard TypeScript escape, invisible to callers.
export function dataMapSpread<U>(
    data: unknown,
    callback: (...args: any[]) => U,
): unknown {
    if (isObject(data)) {
        return objMapSpread(data, callback);
    }

    return arrMapSpread(arrWrap(data), callback);
}

/**
 * Prepend a value to data.
 *
 * @param data - The data to prepend to
 * @param value - The value to prepend
 * @param key - Optional key for objects
 * @returns Data with prepended value
 *
 * @example
 *
 * dataPrepend([2, 3], 1); -> [1, 2, 3]
 * dataPrepend({b: 2, c: 3}, 1, 'a'); -> {a: 1, b: 2, c: 3}
 */
export function dataPrepend<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    value: TValue,
    key: PropertyKey | null = null,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objPrepend(
            data as Record<TKey, TValue>,
            value,
            key as string,
        ) as DataItems<TValue, TKey>;
    }

    return arrPrepend(arrWrap(data), value) as DataItems<TValue>;
}

/**
 * Pull and remove a value from data.
 *
 * @param data - The data to pull from
 * @param key - The key to pull
 * @param defaultValue - Default value if key doesn't exist
 * @returns Object with the pulled value and modified data
 *
 * @example
 *
 * dataPull([1, 2, 3], 1, 'default'); -> {value: 2, data: [1, 3]}
 * dataPull({a: 1, b: 2}, 'b', 'default'); -> {value: 2, data: {a: 1}}
 */
export function dataPull<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TDefault = null,
>(
    data: DataItems<TValue, TKey>,
    key: PathKey,
    defaultValue?: TDefault,
): { value: TValue | TDefault | null; data: DataItems<TValue, TKey> } {
    if (isObject(data)) {
        const result = objPull(
            data as Record<TKey, TValue>,
            key as string,
            defaultValue,
        );

        return {
            value: result.value as TValue | TDefault | null,
            data: result.data as DataItems<TValue, TKey>,
        };
    }

    const result = arrPull(arrWrap(data), key as number, defaultValue);

    return {
        value: result.value as TValue | TDefault | null,
        data: result.data as DataItems<TValue>,
    };
}

/**
 * Convert data to a query string.
 *
 * @param data - The data to convert
 * @returns Query string representation
 *
 * @example
 *
 * dataQuery({name: 'John', age: 30}); -> 'name=John&age=30'
 * dataQuery([1, 2, 3]); -> '0=1&1=2&2=3'
 */
export function dataQuery<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
): string {
    if (isObject(data)) {
        return objQuery(data);
    }

    return arrQuery(arrWrap(data));
}

/**
 * Get random elements from data.
 *
 * @param data - The data to get random elements from
 * @param number - Number of elements to get
 * @param preserveKeys - Whether to preserve keys
 * @returns Random elements
 *
 * @example
 *
 * dataRandom([1, 2, 3, 4], 2); -> [2, 4] (random selection)
 * dataRandom({a: 1, b: 2, c: 3}, 1); -> {b: 2} (random selection)
 */
export function dataRandom<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    number?: number | null,
    preserveKeys = false,
) {
    if (isObject(data)) {
        return objRandom(data, number, preserveKeys);
    }

    return arrRandom(arrWrap(data), number, preserveKeys);
}

/**
 * Search for a value in data and return its key.
 *
 * @param items - The data items to search
 * @param value - The value or callback to search for
 * @param strict - Whether to use strict comparison
 * @returns The key of the found item or false
 */
export function dataSearch<TValue, TKey extends PropertyKey = PropertyKey>(
    items: DataItems<TValue, TKey>,
    value: TValue | string | number | ((item: TValue, key: TKey) => boolean),
    strict: boolean = false,
): TKey | false {
    for (const [key, item] of Object.entries(items)) {
        const actualKey = entriesKeyValue(key) as TKey;

        if (isFunction(value)) {
            if (value(item as TValue, actualKey)) {
                return actualKey;
            }
        }

        if (strict) {
            if (item === value) {
                return actualKey;
            }

            continue;
        }

        if (item == value) {
            return actualKey;
        }
    }

    return false;
}

/**
 * Get the item before a specified value in data.
 *
 * @param items - The data items to search
 * @param value - The value or callback to search for
 * @param strict - Whether to use strict comparison
 * @returns The item before the found item or false
 */
export function dataBefore<TValue, TKey extends PropertyKey = PropertyKey>(
    items: DataItems<TValue, TKey>,
    value: TValue | string | number | ((item: TValue, key: TKey) => boolean),
    strict: boolean = false,
): TValue | null {
    const key = dataSearch(items, value, strict);

    if (key === false) {
        return null;
    }

    const keys = dataKeys(items);
    const position = keys.indexOf(key as string | number);

    if (position === 0) {
        return null;
    }

    return dataGet(items, keys[position - 1] as PathKey) as TValue;
}

/**
 * Get the item after a specified value in data.
 *
 * @param items - The data items to search
 * @param value - The value or callback to search for
 * @param strict - Whether to use strict comparison
 * @returns The item after the found item or null
 */
export function dataAfter<TValue, TKey extends PropertyKey = PropertyKey>(
    items: DataItems<TValue, TKey>,
    value: TValue | string | number | ((item: TValue, key: TKey) => boolean),
    strict: boolean = false,
): TValue | null {
    const key = dataSearch(items, value, strict);

    if (key === false) {
        return null;
    }

    const keys = dataKeys(items);
    const position = keys.indexOf(key as string | number);

    if (position === keys.length - 1) {
        return null;
    }

    return dataGet(items, keys[position + 1] as PathKey) as TValue;
}

/**
 * Get and remove the first N items from the data, mutating it in place.
 * Delegates to arrShift/objShift, which agree on the mutation contract:
 * negative count throws, an empty source returns null for any count, a
 * count of zero returns an empty array, then items are shifted off.
 *
 * @param items - The data to shift from. Mutated in place.
 * @param count - Number of items to shift
 * @returns The shifted item(s), or null if the source had nothing to shift.
 * @throws Error if count is negative.
 */
export function dataShift<TValue, TKey extends PropertyKey = PropertyKey>(
    items: DataItems<TValue, TKey>,
    count: number = 1,
): TValue | TValue[] | null {
    if (isObject(items)) {
        return objShift(items, count);
    }

    return arrShift(arrWrap(items), count);
}

/**
 * Set a value in data by key.
 *
 * @param data - The data to set value in
 * @param key - The key to set
 * @param value - The value to set
 * @returns Data with the value set
 *
 * @example
 *
 * dataSet([1, 2, 3], 1, 'new'); -> [1, 'new', 3]
 * dataSet({a: 1, b: 2}, 'c', 3); -> {a: 1, b: 2, c: 3}
 */
export function dataSet<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TSet = TValue,
>(
    data: DataItems<TValue, TKey>,
    key: PathKey,
    value: TSet,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objSet(
            data as Record<string, TValue>,
            key as string,
            value,
        ) as DataItems<TValue, TKey>;
    }

    return arrSet(arrWrap(data), key as number, value) as DataItems<
        TValue,
        TKey
    >;
}

/**
 * Push values to data.
 *
 * @param data - The data to push to
 * @param key - The key to push to (for objects)
 * @param values - The values to push
 * @returns Data with pushed values
 *
 * @example
 *
 * dataPush([1, 2], null, [3, 4]); -> [1, 2, 3, 4]
 * dataPush({a: [1, 2]}, 'a', [3, 4]); -> {a: [1, 2, 3, 4]}
 */
export function dataPush<TValue, TKey extends PropertyKey, TNewValues>(
    data: DataItems<TValue, TKey>,
    key: PathKey,
    ...values: TNewValues[]
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objPush(data, key as string, ...values) as DataItems<
            TValue,
            TKey
        >;
    }

    return arrPush(arrWrap(data), key as number, ...values) as DataItems<
        TValue,
        TKey
    >;
}

/**
 * Prepend one or more items to the beginning of the data items, mutating
 * it in place. Delegates to arrUnshift/objUnshift, which both mutate.
 *
 * @param data - The data to unshift to. Mutated in place.
 * @param items - The items to prepend
 * @returns The same data reference, mutated.
 */
export function dataUnshift<TValue>(
    data: TValue[],
    ...items: unknown[]
): unknown[];
export function dataUnshift<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue>,
    ...items: unknown[]
): Record<PropertyKey, unknown>;
export function dataUnshift<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    ...items: (TValue | Record<PropertyKey, TValue>)[]
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objUnshift(
            data,
            ...(items as Record<TKey, TValue>[]),
        ) as DataItems<TValue, TKey>;
    }

    return arrUnshift(arrWrap(data), ...(items as TValue[])) as DataItems<
        TValue,
        TKey
    >;
}

/**
 * Shuffle data randomly.
 *
 * @param data - The data to shuffle
 * @returns Shuffled data
 *
 * @example
 *
 * dataShuffle([1, 2, 3, 4]); -> [3, 1, 4, 2] (random order)
 * dataShuffle({a: 1, b: 2, c: 3}); -> {c: 3, a: 1, b: 2} (random order)
 */
export function dataShuffle<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objShuffle(data as Record<string, TValue>) as DataItems<
            TValue,
            TKey
        >;
    }

    return arrShuffle(arrWrap(data)) as DataItems<TValue, TKey>;
}

/**
 * Slice the underlying data items
 *
 * @param data - The data to slice
 * @param offset - The starting index
 * @param length - The number of items to include
 * @returns Sliced data
 */
export function dataSlice<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    offset: number,
    length: number | null = null,
) {
    if (isObject(data)) {
        return objSlice(data, offset, length);
    }

    return arrSlice(arrWrap(data), offset, length);
}

/**
 * Get the sole item that passes a test.
 *
 * @param data - The data to search
 * @param callback - The test function
 * @returns The sole matching item
 * @throws Error if more than one or no items match
 *
 * @example
 *
 * dataSole([1, 2, 3], (value) => value > 2); -> 3
 * dataSole({a: 1, b: 2, c: 3}, (value) => value === 2); -> 2
 */
export function dataSole<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    callback?: (value: TValue, key: TKey) => boolean,
): TValue {
    if (isObject(data)) {
        return objSole(
            data as Record<TKey, TValue>,
            callback as (value: TValue, key: TKey) => boolean,
        );
    }

    return arrSole(
        arrWrap(data),
        callback as (value: TValue, index: number) => boolean,
    );
}

/**
 * Sort data using a callback.
 *
 * @param data - The data to sort
 * @param callback - The value extractor callback or key to sort by
 * @returns Sorted data
 *
 * @example
 *
 * dataSort([3, 1, 4, 2]); -> [1, 2, 3, 4]
 * dataSort({c: 3, a: 1, b: 2}); -> {a: 1, b: 2, c: 3}
 */
export function dataSort<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    callback:
        | ((value: TValue, key: PropertyKey) => unknown)
        | string
        | null = null,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objSort(data, callback);
    }

    return arrSort(arrWrap(data), callback);
}

/**
 * Sort data in descending order using a callback.
 *
 * @param data - The data to sort
 * @param callback - The comparison callback or key to sort by
 * @returns Sorted data in descending order
 *
 * @example
 *
 * dataSortDesc([1, 3, 2, 4]); -> [4, 3, 2, 1]
 * dataSortDesc({a: 1, c: 3, b: 2}); -> {c: 3, b: 2, a: 1}
 */
export function dataSortDesc<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    callback:
        | ((value: TValue, key: PropertyKey) => unknown)
        | string
        | null = null,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objSortDesc(data, callback);
    }

    return arrSortDesc(arrWrap(data), callback);
}

/**
 * Sort data recursively.
 *
 * @param data - The data to sort recursively
 * @param options - Sort options
 * @param descending - Whether to sort in descending order
 * @returns Recursively sorted data
 *
 * @example
 *
 * dataSortRecursive({b: {y: 2, x: 1}, a: {z: 3, w: 4}}); -> {a: {w: 4, z: 3}, b: {x: 1, y: 2}}
 */
export function dataSortRecursive<
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(data: DataItems<TValue, TKey>, descending = false): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objSortRecursive(data, descending);
    }

    return arrSortRecursive(arrWrap(data), descending);
}

/**
 * Sort data recursively in descending order.
 *
 * @param data - The data to sort recursively
 * @param options - Sort options
 * @returns Recursively sorted data in descending order
 *
 * @example
 *
 * dataSortRecursiveDesc({a: {w: 4, z: 3}, b: {x: 1, y: 2}}); -> {b: {y: 2, x: 1}, a: {z: 3, w: 4}}
 */
export function dataSortRecursiveDesc<
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(data: DataItems<TValue, TKey>): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objSortRecursiveDesc(data);
    }

    return arrSortRecursiveDesc(arrWrap(data));
}

/**
 * Splice a portion of the data items, mutating it in place. Delegates to
 * arrSplice/objSplice, which both mutate and return only what was removed —
 * obj keeps the removed entries' own keys, arr reindexes positionally.
 *
 * @param data - The data to splice. Mutated in place.
 * @param offset - The starting index
 * @param length - The number of items to remove. Defaults to everything
 * from offset to the end.
 * @param replacement - The items to insert
 * @returns The removed items.
 */
export function dataSplice<TValue, TKey extends PropertyKey, TReplacements>(
    data: DataItems<TValue, TKey>,
    offset: number,
    length?: number,
    ...replacement: TReplacements[]
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objSplice(data, offset, length, ...replacement);
    }

    return arrSplice(arrWrap(data), offset, length, ...replacement);
}

/**
 * Get a string value from data.
 *
 * @param data - The data to get from
 * @param key - The key to get
 * @param defaultValue - Default string value
 * @returns String value or default
 *
 * @example
 *
 * dataString(['hello', 'world'], 0, ''); -> 'hello'
 * dataString({name: 'John'}, 'name', ''); -> 'John'
 */
export function dataString<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    key: PathKey,
    defaultValue = "",
): string {
    if (isObject(data)) {
        return objString(data, key, defaultValue);
    }

    return arrString(arrWrap(data), key, defaultValue);
}

/**
 * Convert data to CSS classes string.
 *
 * @param data - The data to convert
 * @returns CSS classes string
 *
 * @example
 *
 * dataToCssClasses(['btn', 'btn-primary']); -> 'btn btn-primary'
 * dataToCssClasses({btn: true, 'btn-primary': true, disabled: false}); -> 'btn btn-primary'
 */
export function dataToCssClasses<
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(data: DataItems<TValue, TKey>): string {
    if (isObject(data)) {
        return objToCssClasses(data);
    }

    return arrToCssClasses(arrWrap(data));
}

/**
 * Convert data to CSS styles string.
 *
 * @param data - The data to convert
 * @returns CSS styles string
 *
 * @example
 *
 * dataToCssStyles({color: 'red', 'font-size': '14px'}); -> 'color:red;font-size:14px'
 * dataToCssStyles(['color:red', 'font-size:14px']); -> 'color:red;font-size:14px'
 */
export function dataToCssStyles<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
): string {
    if (isObject(data)) {
        return objToCssStyles(data);
    }

    return arrToCssStyles(arrWrap(data));
}

/**
 * Filter data where callback returns true.
 *
 * @param data - The data to filter
 * @param callback - The test function
 * @returns Filtered data
 *
 * @example
 *
 * dataWhere([1, 2, 3, 4], (value) => value > 2); -> [3, 4]
 * dataWhere({a: 1, b: 2, c: 3}, (value) => value > 1); -> {b: 2, c: 3}
 */
export function dataWhere<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    callback: (value: TValue, key: TKey) => boolean,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objWhere(
            data as Record<TKey, TValue>,
            callback as (value: TValue, key: TKey) => boolean,
        ) as DataItems<TValue, TKey>;
    }

    return arrWhere(
        arrWrap(data),
        callback as (value: TValue, index: number) => boolean,
    ) as DataItems<TValue>;
}

/**
 * Replace the data items with the given items.
 *
 * A `null`/`undefined` `replacerData` is a no-op regardless of `data`'s backing
 * (`EnumeratesValues.php:1106`), dispatched by `data`'s own shape since there's
 * no object-shaped spelling of "null" to satisfy a same-type check.
 *
 * @param data - The original data
 * @param items - The items to replace with. `null`/`undefined` is a no-op.
 * @returns The replaced data
 */
export function dataReplace<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TReplacerKey extends PropertyKey = PropertyKey,
>(
    data: DataItems<TValue, TKey>,
    replacerData: DataItems<TValue, TReplacerKey> | null | undefined,
): DataItems<TValue, TKey> {
    const replacerIsNullish = isNull(replacerData) || isUndefined(replacerData);

    if (isObject(data) && (replacerIsNullish || isObject(replacerData))) {
        return objReplace(data, replacerData) as DataItems<TValue, TKey>;
    }

    // arrReplace accepts an object-shaped (sparse, by-index) replacer too,
    // not just an array one — require only that it isn't a bare scalar.
    if (
        isArray(data) &&
        (replacerIsNullish || isArray(replacerData) || isObject(replacerData))
    ) {
        return arrReplace(data, replacerData) as DataItems<TValue, TKey>;
    }

    throw new Error(
        "Data to replace and items must be of the same type (both array or both object).",
    );
}

/**
 * Recursively replace the data items with the given items recursively.
 *
 * A `null`/`undefined` `replacerData` is a no-op regardless of `data`'s
 * backing, for the same reason as `dataReplace` above.
 *
 * @param data - The original data
 * @param items - The items to replace with. `null`/`undefined` is a no-op.
 * @returns The replaced data
 */
export function dataReplaceRecursive<
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(
    data: DataItems<TValue, TKey>,
    replacerData: DataItems<TValue, TKey> | null | undefined,
): DataItems<TValue, TKey> {
    const replacerIsNullish = isNull(replacerData) || isUndefined(replacerData);

    if (isObject(data) && (replacerIsNullish || isObject(replacerData))) {
        return objReplaceRecursive(data, replacerData) as DataItems<
            TValue,
            TKey
        >;
    }

    // Mirrors arrReplace: an object-shaped replacer is legal on the array branch.
    if (
        isArray(data) &&
        (replacerIsNullish || isArray(replacerData) || isObject(replacerData))
    ) {
        return arrReplaceRecursive(data, replacerData) as DataItems<
            TValue,
            TKey
        >;
    }

    throw new Error(
        "Data to replace and items must be of the same type (both array or both object).",
    );
}

/**
 * Filter data where callback returns false.
 *
 * @param data - The data to filter
 * @param callback - The test function
 * @returns Filtered data (rejected items)
 *
 * @example
 *
 * dataReject([1, 2, 3, 4], (value) => value > 2); -> [1, 2]
 * dataReject({a: 1, b: 2, c: 3}, (value) => value > 1); -> {a: 1}
 */
export function dataReject<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    callback: (value: TValue, key: TKey) => boolean,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objReject(
            data as Record<string, TValue>,
            callback as (value: TValue, key: string) => boolean,
        ) as DataItems<TValue, TKey>;
    }

    return arrReject(
        arrWrap(data),
        callback as (value: TValue, index: number) => boolean,
    ) as DataItems<TValue>;
}

/**
 * Reverse the data items.
 *
 * @param data - The data to reverse
 * @returns Reversed data
 */
export function dataReverse<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objReverse(data as Record<string, TValue>) as DataItems<
            TValue,
            TKey
        >;
    }

    return arrReverse(arrWrap(data)) as DataItems<TValue>;
}

/**
 * Pad data to the specified length with a value.
 *
 * @param data - The data to pad
 * @param size - The desired size
 * @param value - The value to pad with
 * @returns Padded data
 */
export function dataPad<
    TPadValue,
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(
    data: DataItems<TValue, TKey>,
    size: number,
    value: TPadValue,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objPad(data, size, value) as DataItems<TValue, TKey>;
    }

    return arrPad(arrWrap(data), size, value) as DataItems<TValue, TKey>;
}

/**
 * Partition data into two groups based on callback.
 *
 * @param data - The data to partition
 * @param callback - The test function
 * @returns Array with two groups: [passing, failing]
 *
 * @example
 *
 * dataPartition([1, 2, 3, 4], (value) => value > 2); -> [[3, 4], [1, 2]]
 * dataPartition({a: 1, b: 2, c: 3}, (value) => value > 1); -> [{b: 2, c: 3}, {a: 1}]
 */
export function dataPartition<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    callback: (value: TValue, key: TKey) => boolean,
): [DataItems<TValue, TKey>, DataItems<TValue, TKey>] {
    if (isObject(data)) {
        const [passing, failing] = objPartition(
            data as Record<TKey, TValue>,
            callback as (value: TValue, key: TKey) => boolean,
        );
        return [
            passing as DataItems<TValue, TKey>,
            failing as DataItems<TValue, TKey>,
        ];
    }

    const [passing, failing] = arrPartition(
        arrWrap(data),
        callback as (value: TValue, index: number) => boolean,
    );
    return [passing as DataItems<TValue>, failing as DataItems<TValue>];
}

/**
 * Filter out null values from data.
 *
 * @param data - The data to filter
 * @returns Data with null values removed
 *
 * @example
 *
 * dataWhereNotNull([1, null, 2, null, 3]); -> [1, 2, 3]
 * dataWhereNotNull({a: 1, b: null, c: 2}); -> {a: 1, c: 2}
 */
export function dataWhereNotNull<
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(data: DataItems<TValue | null, TKey>): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objWhereNotNull(
            data as Record<TKey, TValue | null>,
        ) as DataItems<TValue, TKey>;
    }

    return arrWhereNotNull(arrWrap(data)) as DataItems<TValue>;
}

/**
 * Get all values from data (array or object).
 *
 * @param data - The data to get values from
 * @returns Array of all values
 *
 * @example
 *
 * Data.values([1, 2, 3]); -> [1, 2, 3]
 * Data.values({a: 1, b: 2, c: 3}); -> [1, 2, 3]
 */
export function dataValues<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
): TValue[] {
    if (isObject(data)) {
        return objValues(data);
    }

    return arrValues(arrWrap(data));
}

/**
 * Get all keys from data (array or object).
 *
 * @param data - The data to get keys from
 * @returns Array of all keys
 *
 * @example
 *
 * Data.keys([1, 2, 3]); -> [0, 1, 2]
 * Data.keys({a: 1, b: 2, c: 3}); -> ['a', 'b', 'c']
 */
export function dataKeys<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
): (string | number)[] {
    if (isObject(data)) {
        return objKeys(data);
    }

    return arrKeys(arrWrap(data));
}

/**
 * Filter data using a callback function.
 *
 * @param data - The data to filter
 * @param callback - The callback function to test each value
 * @returns Filtered data maintaining original structure for objects, new array for arrays
 *
 * @example
 *
 * Data.filter([1, 2, 3, 4], (value) => value > 2); -> [3, 4]
 * Data.filter({a: 1, b: 2, c: 3, d: 4}, (value) => value > 2); -> {c: 3, d: 4}
 */
export function dataFilter<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    callback?: ((value: TValue, key: TKey) => boolean) | null,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objFilter(
            data as Record<TKey, TValue>,
            callback as (value: TValue, key: TKey) => boolean | null,
        ) as DataItems<TValue, TKey>;
    }

    return arrFilter(
        arrWrap(data),
        callback as (value: TValue, index: number) => boolean,
    ) as DataItems<TValue>;
}

/**
 * Transform data using a callback function.
 *
 * @param data - The data to map
 * @param callback - The callback function to transform each value
 * @returns Transformed data maintaining original structure
 *
 * @example
 *
 * dataMap([1, 2, 3], (value) => value * 2); -> [2, 4, 6]
 * dataMap({a: 1, b: 2}, (value) => value * 2); -> {a: 2, b: 4}
 */
export function dataMap<
    TMapValue,
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(
    data: DataItems<TValue, TKey>,
    callback: (value: TValue, key: TKey) => TMapValue,
): DataItems<TMapValue, TKey> {
    if (isObject(data)) {
        return objMap(
            data as Record<string, TValue>,
            callback as (value: TValue, key: string) => TMapValue,
        ) as DataItems<TMapValue, TKey>;
    }

    return arrMap(
        arrWrap(data),
        callback as (value: TValue, index: number) => TMapValue,
    ) as DataItems<TMapValue, TKey>;
}

/**
 * Get the first value from data that passes a test.
 *
 * @param data - The data to search
 * @param callback - The callback function to test each value
 * @param defaultValue - The default value to return if no match found
 * @returns The first matching value or default value
 *
 * @example
 *
 * dataFirst([1, 2, 3, 4], (value) => value > 2); -> 3
 * dataFirst({a: 1, b: 2, c: 3}, (value) => value > 1); -> 2
 * dataFirst(new Map([['a', 1], ['b', 2]])); -> 1
 */
// Overload: Map, keyed by its own keys
export function dataFirst<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TFirstDefault = null,
>(
    data: Map<TKey, TValue>,
    callback?: ((value: TValue, key: TKey) => boolean) | null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: array or any other iterable, keyed by position
export function dataFirst<TValue, TFirstDefault = null>(
    data: TValue[] | Iterable<TValue>,
    callback?: ((value: TValue, key: number) => boolean) | null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: object and general fallback
export function dataFirst<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TFirstDefault = null,
>(
    data: DataIterableItems<TValue, TKey>,
    callback?: ((value: TValue, key: TKey) => boolean) | null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Implementation
export function dataFirst<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TFirstDefault = null,
>(
    data: DataIterableItems<TValue, TKey>,
    callback?: ((value: TValue, key: TKey) => boolean) | null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null {
    if (isKeyedData(data)) {
        return objFirst(data, callback, defaultValue);
    }

    return arrFirst(
        toPositionalData<TValue>(data),
        callback as ((value: TValue, index: number) => boolean) | null,
        defaultValue,
    );
}

/**
 * Get the last value from data that passes a test.
 *
 * @param data - The data to search
 * @param callback - The callback function to test each value
 * @param defaultValue - The default value to return if no match found
 * @returns The last matching value or default value
 *
 * @example
 *
 * Data.last([1, 2, 3, 4], (value) => value < 4); -> 3
 * Data.last({a: 1, b: 2, c: 3}, (value) => value > 1); -> 3
 * Data.last(new Map([['a', 1], ['b', 2]])); -> 2
 */
// Overload: Map, keyed by its own keys
export function dataLast<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TDefault = null,
>(
    data: Map<TKey, TValue>,
    callback?: ((value: TValue, key: TKey) => boolean) | null,
    defaultValue?: TDefault | (() => TDefault),
): TValue | TDefault | null;
// Overload: array or any other iterable, keyed by position
export function dataLast<TValue, TDefault = null>(
    data: TValue[] | Iterable<TValue>,
    callback?: ((value: TValue, key: number) => boolean) | null,
    defaultValue?: TDefault | (() => TDefault),
): TValue | TDefault | null;
// Overload: object and general fallback
export function dataLast<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TDefault = null,
>(
    data: DataIterableItems<TValue, TKey>,
    callback?: ((value: TValue, key: TKey) => boolean) | null,
    defaultValue?: TDefault | (() => TDefault),
): TValue | TDefault | null;
// Implementation
export function dataLast<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TDefault = null,
>(
    data: DataIterableItems<TValue, TKey>,
    callback?: ((value: TValue, key: TKey) => boolean) | null,
    defaultValue?: TDefault | (() => TDefault),
): TValue | TDefault | null {
    if (isKeyedData(data)) {
        return objLast(data, callback, defaultValue);
    }

    return arrLast(
        toPositionalData<TValue>(data),
        callback as ((value: TValue, index: number) => boolean) | null,
        defaultValue,
    );
}

/**
 * Determine if data contains a value.
 *
 * @param data - The data to search
 * @param value - The value to search for or callback function
 * @returns True if the value exists, false otherwise
 *
 * @example
 *
 * Data.contains([1, 2, 3], 2); -> true
 * Data.contains({a: 1, b: 2}, (value) => value > 1); -> true
 */
export function dataContains<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    value: TValue | ((value: TValue, key: TKey) => boolean),
    strict = false,
): boolean {
    if (isObject(data)) {
        return objContains(data, value, strict);
    }

    return arrContains(arrWrap(data), value, strict);
}

/**
 * Get the differences between data collections.
 *
 * Both backings normalize `other` through `arrayableValues`, so a mismatched
 * shape, a scalar, and `null`/`undefined` are all defined behaviour rather than
 * an error.
 *
 * @param data - The source data
 * @param other - The data to compare against
 * @returns Data with differences, preserving structure
 *
 * @example
 *
 * Data.diff([1, 2, 3, 4], [2, 4]); -> [1, 3]
 */
export function dataDiff<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TOtherKey extends PropertyKey = PropertyKey,
>(
    data: DataItems<TValue, TKey>,
    other: DataItems<TValue, TOtherKey> | null | undefined,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        // `other`'s shape is left unnarrowed on purpose (no cast to
        // Record<TOtherKey, TValue>) — both branches normalize it themselves,
        // so laundering it here would hide a real mismatch.
        return objDiff(data as Record<TKey, TValue>, other) as DataItems<
            TValue,
            TKey
        >;
    }

    return arrDiff(arrWrap(data), other) as DataItems<TValue>;
}

/**
 * Get the items whose key and value are not both present in the given other data.
 *
 * Unlike `dataDiff`, this doesn't normalize `other` through `arrayableValues` —
 * a key on `other` with a different value is what keeps the item, so `other`'s
 * own keys matter here, not just its values.
 *
 * @param data - The source data
 * @param other - The data to compare against
 * @returns Data with differences, preserving structure
 *
 * @example
 *
 * dataDiffAssoc({a: 1, b: 2, c: 3}, {b: 2}); -> {a: 1, c: 3}
 */
export function dataDiffAssoc<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    other: DataItems<TValue, TKey>,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objDiffAssoc(
            data as Record<TKey, TValue>,
            other as Record<TKey, TValue>,
        ) as DataItems<TValue, TKey>;
    }

    return arrDiffAssoc(
        data as TValue[],
        other as TValue[],
    ) as DataItems<TValue>;
}

/**
 * A JS array's own keys are its indices, in the same shape
 * `Object.entries`/`Object.keys` produce for a plain object — so
 * `array_diff_uassoc`/`array_diff_ukey`'s key-comparison algorithm applies
 * unchanged. Reindexes the survivors, matching every other array-branch
 * diff/intersect function in this file.
 *
 * @param data - The source array.
 * @param other - The array to compare keys (and optionally values) against.
 * @param callback - The callback used to compare keys.
 * @param compareValues - Whether to also require the values to match (diffAssocUsing vs diffKeysUsing).
 * @returns The reindexed survivors.
 */
function arrayDiffUsingKeys<TValue>(
    data: readonly TValue[],
    other: readonly unknown[],
    callback: (keyA: PropertyKey, keyB: PropertyKey) => boolean,
    compareValues: boolean,
): TValue[] {
    const otherEntries = Object.entries(other);

    return Object.entries(data)
        .filter(([key, value]) => {
            const matchingKey = otherEntries.find(([otherKey]) =>
                callback(key, otherKey),
            );

            if (matchingKey === undefined) {
                return true;
            }

            return compareValues && matchingKey[1] !== value;
        })
        .map(([, value]) => value);
}

/**
 * Diff data with the given other data using a callback for key comparison.
 * For objects, compares keys using the callback and values using strict equality.
 * For arrays, the same algorithm runs over the arrays' own indices (their
 * only possible "keys"), reindexing the survivors.
 *
 * @param data - The data to diff
 * @param other - The data to diff against
 * @param callback - Function to compare keys (returns true if keys match)
 * @returns Diff result maintaining appropriate structure
 *
 * @example
 *
 * const strcasecmp = (a: unknown, b: unknown) => String(a).toLowerCase() === String(b).toLowerCase();
 * dataDiffAssocUsing({a: 'green', b: 'brown'}, {A: 'green', c: 'blue'}, strcasecmp); -> {b: 'brown'}
 */
export function dataDiffAssocUsing<
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(
    data: DataItems<TValue, TKey>,
    other: DataItems<TValue, TKey>,
    callback: (keyA: TKey, keyB: TKey) => boolean,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objDiffAssocUsing(
            data as Record<TKey, TValue>,
            other as Record<TKey, TValue>,
            callback,
        ) as DataItems<TValue, TKey>;
    }

    return arrayDiffUsingKeys(
        arrWrap(data),
        arrWrap(other),
        callback as (keyA: PropertyKey, keyB: PropertyKey) => boolean,
        true,
    ) as DataItems<TValue>;
}

/**
 * Diff data keys with the given other data using a callback for key comparison only.
 * For objects, compares keys using the callback and ignores values completely.
 * For arrays, the same algorithm runs over the arrays' own indices (their
 * only possible "keys"), reindexing the survivors.
 *
 * @param data - The data to diff
 * @param other - The data to diff against
 * @param callback - Function to compare keys (returns true if keys match)
 * @returns Diff result maintaining appropriate structure
 *
 * @example
 *
 * const strcasecmp = (a: unknown, b: unknown) => String(a).toLowerCase() === String(b).toLowerCase();
 * dataDiffKeysUsing({id: 1, first_word: 'Hello'}, {ID: 123, foo_bar: 'Hello'}, strcasecmp); -> {first_word: 'Hello'}
 */
export function dataDiffKeysUsing<
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(
    data: DataItems<TValue, TKey>,
    other: DataItems<TValue, TKey>,
    callback: (keyA: TKey, keyB: TKey) => boolean,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objDiffKeysUsing(
            data as Record<TKey, TValue>,
            other as Record<TKey, TValue>,
            callback,
        ) as DataItems<TValue, TKey>;
    }

    return arrayDiffUsingKeys(
        arrWrap(data),
        arrWrap(other),
        callback as (keyA: PropertyKey, keyB: PropertyKey) => boolean,
        false,
    ) as DataItems<TValue>;
}

/**
 * Pluck values from data by a key path.
 *
 * @param data - The data to pluck from
 * @param value - The key path to pluck
 * @param key - Optional key path to use as keys in result
 * @returns Plucked values maintaining appropriate structure
 *
 * @example
 *
 * Data.pluck([{name: 'John'}, {name: 'Jane'}], 'name'); -> ['John', 'Jane']
 * Data.pluck({a: {name: 'John'}, b: {name: 'Jane'}}, 'name'); -> ['John', 'Jane']
 */
export function dataPluck<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    value: string | ((item: TValue, key: TKey) => TValue),
    key:
        | PropertyKey
        | ((item: TValue, key: TKey) => string | number)
        | null = null,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objPluck(
            data as Record<TKey, TValue>,
            value as string | ((item: Record<TKey, TValue>) => unknown),
            key as
                | string
                | ((item: Record<TKey, TValue>) => string | number)
                | null,
        ) as DataItems<TValue, TKey>;
    }

    return arrPluck(
        arrWrap(data) as Record<TKey, TValue>[],
        value as string | ((item: Record<TKey, TValue>) => TValue),
        key as
            | string
            | ((item: Record<TKey, TValue>) => string | number)
            | null,
    ) as DataItems<TValue, TKey>;
}

/**
 * Get and remove the last N items from the data, mutating it in place.
 * Delegates to arrPop/objPop, which both mutate and agree on returning the
 * popped item(s) in reverse order for a count greater than one.
 *
 * @param data - The data to pop from. Mutated in place.
 * @param count - The number of items to pop
 * @returns The popped item(s), or null if the source had nothing to pop.
 */
export function dataPop<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    count: number = 1,
) {
    if (isObject(data)) {
        return objPop(data, count);
    }

    return arrPop(data, count);
}

/**
 * Intersect the data with the given items.
 *
 * Like `dataDiff`, both backings normalize `other` through `arrayableValues`,
 * so a mismatched shape, a scalar and `null`/`undefined` are all defined
 * behaviour — `array_intersect` compares by value only. The key-aware
 * `intersectAssoc*`/`intersectByKeys` siblings still require matching shapes.
 *
 * @param data - The original data
 * @param items - The items to intersect with
 * @param callable - Optional comparison function
 * @returns The intersected data
 */
export function dataIntersect<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TOtherKey extends PropertyKey = PropertyKey,
>(
    data: DataItems<TValue, TKey>,
    other: DataItems<TValue, TOtherKey> | null | undefined,
    callable: ((a: TValue, b: TValue) => boolean) | null = null,
): DataItems<TValue, TKey> {
    if (isObject(data)) {
        return objIntersect(data, other, callable);
    }

    return arrIntersect(data, other, callable);
}

/**
 * Intersect the data with the given items with additional key check.
 * Returns items where both the key AND value match.
 *
 * A `null`/`undefined` `other` is treated as empty rather than
 * throwing the same-type error below.
 *
 * @param data - The original data
 * @param items - The items to intersect with
 * @returns The intersected data
 *
 * @example
 *
 * dataIntersectAssoc({a: 'green', b: 'brown'}, {a: 'green', b: 'yellow'}); -> {a: 'green'}
 * dataIntersectAssoc([1, 2, 3], [2, 3, 4]); -> []
 */
export function dataIntersectAssoc<
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(
    data: DataItems<TValue, TKey>,
    other: DataItems<TValue, TKey> | null | undefined,
): DataItems<TValue, TKey> {
    const otherIsNullish = isNull(other) || isUndefined(other);

    if (isObject(data) && (otherIsNullish || isObject(other))) {
        return objIntersectAssoc(data, other) as DataItems<TValue, TKey>;
    }

    if (isArray(data) && (otherIsNullish || isArray(other))) {
        return arrIntersectAssoc(data, other) as DataItems<TValue, TKey>;
    }

    throw new Error(
        "Data to intersect must be of the same type (both array or both object).",
    );
}

/**
 * Intersect the data with the given items with additional key check, using the callback.
 * The callback is used to compare keys, while values are compared strictly.
 *
 * @param data - The original data
 * @param items - The items to intersect with
 * @param callback - The callback function to compare keys (returns true if keys match)
 * @returns The intersected data
 *
 * @example
 *
 * const strcasecmpKeys = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
 * dataIntersectAssocUsing({a: 'green', b: 'brown'}, {A: 'GREEN', B: 'brown'}, strcasecmpKeys); -> {b: 'brown'}
 */
export function dataIntersectAssocUsing<
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(
    data: DataItems<TValue, TKey>,
    other: DataItems<TValue, TKey> | null | undefined,
    callback: (keyA: TKey, keyB: TKey) => boolean,
) {
    const otherIsNullish = isNull(other) || isUndefined(other);

    if (isObject(data) && (otherIsNullish || isObject(other))) {
        return objIntersectAssocUsing(
            data as Record<string, TValue>,
            other as Record<string, TValue> | null | undefined,
            callback as (keyA: PropertyKey, keyB: PropertyKey) => boolean,
        ) as DataItems<TValue, TKey>;
    }

    if (isArray(data) && (otherIsNullish || isArray(other))) {
        return arrIntersectAssocUsing(
            data,
            other as TValue[] | null | undefined,
            callback as (keyA: number, keyB: number) => boolean,
        ) as DataItems<TValue>;
    }

    throw new Error(
        "Data to intersect must be of the same type (both array or both object).",
    );
}

/**
 * Intersect the data with the given items by key.
 *
 * @param data - The original data
 * @param items - The items to intersect with
 * @returns The intersected data
 */
export function dataIntersectByKeys<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TOtherKey extends PropertyKey = PropertyKey,
>(
    data: DataItems<TValue, TKey>,
    other: DataItems<TValue, TOtherKey> | null | undefined,
): DataItems<TValue, TKey> {
    const otherIsNullish = isNull(other) || isUndefined(other);

    if (isObject(data) && (otherIsNullish || isObject(other))) {
        return objIntersectByKeys(data, other) as DataItems<TValue, TKey>;
    }

    if (isArray(data) && (otherIsNullish || isArray(other))) {
        return arrIntersectByKeys(data, other) as DataItems<TValue, TKey>;
    }

    throw new Error(
        "Data to intersect by keys must be of the same type (both array or both object).",
    );
}
