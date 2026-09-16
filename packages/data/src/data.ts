import {
    add as arrAdd,
    arrayItem,
    boolean as arrBoolean,
    chunk as arrChunk,
    chunkBy as arrChunkBy,
    chunkWhile as arrChunkWhile,
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
    chunkBy as objChunkBy,
    chunkWhile as objChunkWhile,
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
import type { DataItems, PathKey } from "@tolki/types";
import {
    entriesKeyValue,
    isArray,
    isFunction,
    isNull,
    isObject,
    isUndefined,
    phpArrayKey,
} from "@tolki/utils";

import {
    dispatch,
    isKeyedData,
    toKeyedData,
    toPositionalBacking,
    toPositionalData,
} from "./dispatch";

/**
 * A note on most of the `as` casts below: each function here dispatches a loose
 * `DataItems<TValue, TKey>` union to a stricter `@tolki/arr`/`@tolki/obj`
 * implementation via `isObject()`, which can't narrow the union's generics.
 * Widening happens at this dispatch boundary, not by loosening `obj`/`arr`'s own
 * return types. Some casts carry their own comment for a more specific reason.
 */

/**
 * Hand back a result built from a list backing as a list while its keys are `0..n-1`, as PHP's
 * `array_is_list` would accept it, and otherwise as the object that holds PHP's keyed array.
 *
 * @param items - The result, keyed as obj's helpers key a list's copy.
 * @returns The result's values when its keys are `0..n-1`, otherwise the result itself.
 */
function listWhenIndexed<TValue>(
    items: Record<string, TValue>,
): TValue[] | Record<string, TValue> {
    return Object.keys(items).every((key, index) => key === String(index))
        ? Object.values(items)
        : items;
}

/** A read-only list resolves to `unknown[]`, which it is not assignable to, so `DataAdd` rejects it. */
type MutableBacking<T> = T extends readonly unknown[] ? unknown[] : unknown;

/**
 * `dataAdd`'s rows, each answering with its delegate's own return type.
 *
 * A read-only list is rejected until Task D5 Step 1 (F-18) makes `arr.add` deep-copy along the
 * written path: the copy is shallow today, so a dot-path key writes into the caller's nested
 * value. Relax this then, deliberately rather than by accident.
 */
interface DataAdd {
    (
        data: ReadonlyMap<PropertyKey, unknown>,
        key: PathKey,
        value: unknown,
    ): ReturnType<typeof objAdd>;
    <TValue, TAddValue>(
        data: TValue[],
        key: PathKey,
        value: TAddValue,
    ): ReturnType<typeof arrAdd<TValue, TAddValue>>;
    <TData extends object, TKey extends string | number, TAddValue>(
        data: TData & MutableBacking<TData>,
        key: TKey,
        value: TAddValue,
    ): ReturnType<typeof objAdd<TData, TKey, TAddValue>>;
}

/**
 * Add an element to data.
 *
 * @param data - The data to add to. A read-only list is rejected; see `DataAdd`
 * @param key - The key to add at
 * @param value - The value to add
 * @returns New data with the element added, matching the delegate's own result
 *
 * @example
 *
 * dataAdd([1, 2], 2, 3); -> [1, 2, 3]
 * dataAdd({a: 1}, 'b', 2); -> {a: 1, b: 2}
 */
export const dataAdd: DataAdd = dispatch(arrAdd, objAdd);

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
export const dataItem = dispatch(arrayItem, objectItem);

/**
 * Get a boolean value from data.
 *
 * @param data - The data to get from
 * @param key - The key to get
 * @param defaultValue - Default boolean value, `null` when omitted, as in PHP
 * @returns Boolean value or default
 *
 * @example
 *
 * dataBoolean([true, false], 0, false); -> true
 * dataBoolean({active: true}, 'active', false); -> true
 */
export const dataBoolean = dispatch(arrBoolean, objBoolean);

/**
 * Chunk the data into chunks of the given size.
 *
 * @param data - The data to chunk
 * @param size - The size of each chunk
 * @param preserveKeys - Whether to preserve the original keys, defaults to true
 * @returns Chunked data
 */
export const dataChunk = dispatch(arrChunk, objChunk);

/**
 * Chunk the data into chunks with a callback.
 *
 * @param data - The data to chunk
 * @param callback - Receives the value, its key and the chunk built so far; return true to keep appending
 * @returns Chunked data
 *
 * @remarks A Map backing widens the callback's value parameter to `unknown`.
 *
 * @example
 *
 * dataChunkWhile([1, 1, 2], (value, index, chunk) => chunk.at(-1) === value); -> [[1, 1], [2]]
 * dataChunkWhile({ a: 1, b: 1, c: 2 }, (value, key, chunk) => Object.values(chunk).at(-1) === value);
 * -> { 0: { a: 1, b: 1 }, 1: { c: 2 } }
 */
export const dataChunkWhile = dispatch(arrChunkWhile, objChunkWhile);

/**
 * Chunk the data into chunks by comparing adjacent values using the given key or callback.
 *
 * @param data - The data to chunk
 * @param key - A path into each item, or a callback receiving the value and its key
 * @returns Chunked data
 *
 * @example
 *
 * dataChunkBy([1, 1, 2], (value) => value); -> [[1, 1], [2]]
 * dataChunkBy({ a: 1, b: 1, c: 2 }, (value) => value); -> { 0: { a: 1, b: 1 }, 1: { c: 2 } }
 */
export const dataChunkBy = dispatch(arrChunkBy, objChunkBy);

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
export const dataCollapse = dispatch(arrCollapse, objCollapse);

/**
 * Combine two data sets: the first set's values become the keys, the second set's values the values.
 * Either set may be a list or an object, as `array_combine` takes any two arrays.
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
    itemsB: DataItems<TValues>,
): ReturnType<typeof objCombine>;
export function dataCombine<TKeys, TValues>(
    itemsA: TKeys[],
    itemsB: DataItems<TValues>,
): ReturnType<typeof arrCombine>;
export function dataCombine<TKeys, TValues>(
    itemsA: Record<PropertyKey, TKeys>,
    itemsB: DataItems<TValues>,
): ReturnType<typeof objCombine>;
export function dataCombine<TKeys, TValues>(
    itemsA: DataItems<TKeys>,
    itemsB: DataItems<TValues>,
) {
    if (isObject(itemsA)) {
        // Collection::combine keys by $this->all(), which never unwraps; handing obj a list keeps it from doing so.
        return objCombine(Object.values(itemsA), itemsB);
    }

    return arrCombine(itemsA, itemsB);
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
    if (isKeyedData(data)) {
        return Object.values(toKeyedData<TKey, TValue>(data)).length;
    }

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
export const dataCrossJoin = dispatch(arrCrossJoin, objCrossJoin);

/**
 * Divide data into keys and values.
 *
 * @param data - The data to divide
 * @returns Array with keys and values, matching the delegate's own result
 *
 * @example
 *
 * dataDivide([1, 2, 3]); -> [[0, 1, 2], [1, 2, 3]]
 * dataDivide({a: 1, b: 2}); -> [['a', 'b'], [1, 2]]
 */
export const dataDivide = dispatch(arrDivide, objDivide);

/**
 * Convert data to dot notation.
 *
 * @param data - The data to convert
 * @param prepend - String to prepend to keys
 * @param depth - Maximum depth to flatten. Defaults to Infinity.
 * @returns Data in dot notation, matching the delegate's own result
 *
 * @example
 *
 * dataDot({a: {b: 1, c: 2}}); -> {'a.b': 1, 'a.c': 2}
 */
export const dataDot = dispatch(arrDot, objDot);

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
        // DataItems dispatch can't carry obj's per-shape type; the data type pass replaces this cast.
        return objUndot(data) as DataItems<TValue, TKey>;
    }

    // Widen: `asArray` routes object-backed data to `Arr.undot`, which rejects
    // non-numeric-first keys — `dataUndot`'s own contract is broader; `Arr.undot`'s
    // runtime guard is what catches a bad key instead.
    return arrUndot(data as Record<TKey, TValue>) as DataItems<TValue>;
}

/**
 * Union multiple objects or arrays items into one, the way PHP's `+` does: the first
 * item that isn't nullish is the backing, and each other item may be a list or an object.
 * A list backing stays a list while every item extends its keys as `0..n-1`; once an item
 * adds a string key or leaves a gap, the result is an object, as PHP's keyed array is.
 *
 * Not a `dispatch` pair: `arr.union` drops a non-integer-like key and fills a gap with
 * `undefined` to keep its `unknown[]` return, which PHP's `+` does not, so obj serves the
 * list backing too. It is also variadic, so no single argument picks the backing.
 *
 * @param items - the data items to union
 * @return A new object or array containing all values
 */
export function dataUnion<TValue>(
    ...items: (TValue[] | Record<PropertyKey, TValue> | null | undefined)[]
) {
    // A nullish operand is `(array) null` in PHP: empty, and no evidence about the backing.
    const [backing = [], ...operands] = items.filter(
        (item) => !isNull(item) && !isUndefined(item),
    ) as (TValue[] | Record<PropertyKey, TValue>)[];

    if (isObject(backing)) {
        return objUnion(backing, ...operands);
    }

    return operands.reduce<TValue[] | Record<PropertyKey, TValue>>(
        (result, operand) => {
            const merged = objUnion(result, operand);

            // Keys PHP inserted out of order after a gap can't be a list, even once later operands fill it.
            return isArray(result) ? listWhenIndexed(merged) : merged;
        },
        arrUnion(backing),
    );
}

/**
 * Get all data except specified keys.
 *
 * @param data - The source data
 * @param keys - Keys to exclude
 * @returns Data without specified keys, matching the delegate's own result
 *
 * @example
 *
 * dataExcept([1, 2, 3, 4], [1, 3]); -> [1, 3] (indices 0 and 2)
 * dataExcept({a: 1, b: 2, c: 3}, ['b']); -> {a: 1, c: 3}
 */
export const dataExcept = dispatch(arrExcept, objExcept);

/**
 * Get all data except for specified values.
 *
 * @param data - The data to filter
 * @param values - The values to exclude
 * @param strict - Whether to use strict comparison
 * @returns Data without specified values, matching the delegate's own result
 *
 * @example
 *
 * dataExceptValues(['foo', 'bar', 'baz'], ['foo', 'baz']); -> [1 => 'bar']
 * dataExceptValues({name: 'taylor', age: 26}, [26]); -> {name: 'taylor'}
 */
export const dataExceptValues = dispatch(arrExceptValues, objExceptValues);

/**
 * Check if a key exists in data.
 *
 * @param data - The data to check
 * @param key - The key to check for
 * @returns True if key exists, matching the delegate's own result
 *
 * @example
 *
 * dataExists([1, 2, 3], 1); -> true
 * dataExists({a: 1, b: 2}, 'c'); -> false
 */
export const dataExists = dispatch(arrExists, objExists);

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
export const dataTake = dispatch(arrTake, objTake);

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
export const dataFlatten = dispatch(arrFlatten, objFlatten);

/**
 * Flip the keys and values of an object or array.
 *
 * @param data - The data of items to flip
 * @return - the data items flipped, matching the delegate's own result
 */
export const dataFlip = dispatch(arrFlip, objFlip);

/**
 * Get a float value from data.
 *
 * @param data - The data to get from
 * @param key - The key to get
 * @param defaultValue - Default float value, `null` when omitted, as in PHP
 * @returns Float value or default
 *
 * @example
 *
 * dataFloat([1.5, 2.7], 0, 0.0); -> 1.5
 * dataFloat({price: 9.99}, 'price', 0.0); -> 9.99
 */
export const dataFloat = dispatch(arrFloat, objFloat);

/**
 * Remove keys from data.
 *
 * @param data - The data to remove from
 * @param keys - Keys to remove
 * @returns Data with keys removed, matching the delegate's own result
 *
 * @example
 *
 * dataForget([1, 2, 3, 4], [1, 3]); -> [1, 3] (removes indices 1 and 3)
 * dataForget({a: 1, b: 2, c: 3}, ['b']); -> {a: 1, c: 3}
 */
export const dataForget = dispatch(arrForget, objForget);

/**
 * Create data from various item types.
 *
 * @param items - The items to create data from
 * @returns Data created from items, matching the delegate's own result
 *
 * @example
 *
 * dataFrom([1, 2, 3]); -> [1, 2, 3]
 * dataFrom({a: 1, b: 2}); -> {a: 1, b: 2}
 * dataFrom(new Map([['a', 1]])); -> {a: 1}
 * dataFrom(new Set([1, 2])); -> [1, 2]
 */
// `arr.from` is itself the normalizer — it walks Maps, Sets and generators and rejects
// scalars — so normalizing before it would swallow its own guard.
export const dataFrom = dispatch(arrFrom, objFrom, (items) => items);

/**
 * Get a value from data by key.
 *
 * @param data - The data to get from
 * @param key - The key to get
 * @param defaultValue - Default value if key doesn't exist
 * @returns The value or default, matching the delegate's own result
 *
 * @example
 *
 * dataGet([1, 2, 3], 1, 'default'); -> 2
 * dataGet({a: 1, b: 2}, 'c', 'default'); -> 'default'
 */
export const dataGet = dispatch(arrGet, objGet);

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
export const dataHas = dispatch(arrHas, objHas);

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
export const dataHasAll = dispatch(arrHasAll, objHasAll);

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
export const dataHasAny = dispatch(arrHasAny, objHasAny);

/**
 * Test if every item in data passes a test.
 *
 * @param data - The data to test
 * @param callback - The test function
 * @returns True if every item passes
 *
 * @remarks A Map backing widens the callback's value parameter to `unknown`.
 *
 * @example
 *
 * dataEvery([2, 4, 6], (value) => value % 2 === 0); -> true
 * dataEvery({a: 2, b: 4}, (value) => value % 2 === 0); -> true
 * dataEvery(new Map([['a', 2]]), (value) => value % 2 === 0); -> true
 * dataEvery(new Set([2, 4]), (value) => value % 2 === 0); -> true
 */
// A Set or generator must reach `arrEvery` UNREAD, so an infinite generator still answers;
// this normalises with `toPositionalData` rather than the materialising default.
export const dataEvery = dispatch(arrEvery, objEvery, toPositionalData);

/**
 * Test if some items in data pass a test.
 *
 * @param data - The data to test
 * @param callback - The test function
 * @returns True if some items pass
 *
 * @remarks A Map backing widens the callback's value parameter to `unknown`.
 *
 * @example
 *
 * dataSome([1, 2, 3], (value) => value > 2); -> true
 * dataSome({a: 1, b: 2}, (value) => value > 2); -> false
 * dataSome(new Map([['a', 1], ['b', 3]]), (value) => value > 2); -> true
 * dataSome(new Set([1, 3]), (value) => value > 2); -> true
 */
// A Set or generator must reach `arrSome` UNREAD, so an infinite generator still answers;
// this normalises with `toPositionalData` rather than the materialising default.
export const dataSome = dispatch(arrSome, objSome, toPositionalData);

/**
 * Get an integer value from data.
 *
 * @param data - The data to get from
 * @param key - The key to get
 * @param defaultValue - Default integer value, `null` when omitted, as in PHP
 * @returns Integer value or default
 *
 * @example
 *
 * dataInteger([1, 2, 3], 0, 0); -> 1
 * dataInteger({count: 42}, 'count', 0); -> 42
 */
export const dataInteger = dispatch(arrInteger, objInteger);

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
export const dataJoin = dispatch(arrJoin, objJoin);

/**
 * Key data by a given key or callback.
 *
 * @param data - The data to key
 * @param keyBy - Key or callback to key by; the callback receives each item and its key (a list's index)
 * @returns Keyed data, matching the delegate's own result
 *
 * @example
 *
 * dataKeyBy([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}], 'id');
 * -> {1: {id: 1, name: 'John'}, 2: {id: 2, name: 'Jane'}}
 */
export const dataKeyBy = dispatch(arrKeyBy, objKeyBy);

/**
 * Prepend keys with a given prefix.
 *
 * @param data - The data to prepend keys to
 * @param prependWith - The prefix to prepend
 * @returns Data with prepended keys, matching the delegate's own result
 *
 * @example
 *
 * dataPrependKeysWith({name: 'John', age: 30}, 'user_');
 * -> {user_name: 'John', user_age: 30}
 */
export const dataPrependKeysWith = dispatch(
    arrPrependKeysWith,
    objPrependKeysWith,
);

/**
 * Get only specified keys from data.
 *
 * @param data - The data to get from
 * @param keys - Keys to include
 * @returns Data with only specified keys, matching the delegate's own result
 *
 * @example
 *
 * dataOnly([1, 2, 3, 4], [0, 2]); -> [1, 3]
 * dataOnly({a: 1, b: 2, c: 3}, ['a', 'c']); -> {a: 1, c: 3}
 */
export const dataOnly = dispatch(arrOnly, objOnly);

/**
 * Get only items with specified values from data.
 *
 * @param data - The data to filter
 * @param values - The values to include
 * @param strict - Whether to use strict comparison
 * @returns Data with only specified values, matching the delegate's own result
 *
 * @example
 *
 * dataOnlyValues(['foo', 'bar', 'baz'], ['foo', 'baz']); -> [0 => 'foo', 2 => 'baz']
 * dataOnlyValues({name: 'taylor', age: 26}, [26]); -> {age: 26}
 */
export const dataOnlyValues = dispatch(arrOnlyValues, objOnlyValues);

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
export const dataSelect = dispatch(arrSelect, objSelect);

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
            // DataItems dispatch can't carry obj's per-shape type; the data type pass replaces this cast.
            normalizedCallback as (
                value: TValue,
                key: string | number,
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
 * @returns Mapped data, matching the delegate's own result
 *
 * @example
 *
 * dataMapSpread([[1, 2], [3, 4]], (a, b) => a + b); -> [3, 7]
 */
export const dataMapSpread = dispatch(arrMapSpread, objMapSpread);

/**
 * Prepend a value to data.
 *
 * No `dispatch` pair is possible: `arr.prepend` takes `key?: number` and returns `TValue[]`,
 * so it cannot express PHP's keyed answer at all. Only the non-integer-like key's entry
 * disappearing, where PHP's `+` keeps it, is an arr defect; Task D5 owns arr.prepend.
 *
 * @param data - The data to prepend to
 * @param value - The value to prepend
 * @param rest - The key; omit it to unshift under key 0, as `Arr::prepend` does with two arguments.
 * A list given any key but 0 comes back as an object, as PHP's `[$key => $value] + $list` is keyed
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
    ...rest: [key?: PropertyKey | null]
): DataItems<TValue, TKey> {
    // No dispatch pair serves this, so the Map and the iterable backings are normalized here.
    if (isKeyedData(data)) {
        return objPrepend(
            toKeyedData<TKey, TValue>(data),
            value,
            ...rest,
        ) as DataItems<TValue, TKey>;
    }

    const backing = toPositionalBacking(data) as TValue[];

    if (rest.length === 0) {
        return arrPrepend(backing, value) as DataItems<TValue>;
    }

    // [$key => $value] + $list starts with the key, so it stays a list only when the key casts to 0.
    const prepended = objPrepend({ ...backing }, value, ...rest);

    return (
        phpArrayKey(rest[0]) === 0 ? Object.values(prepended) : prepended
    ) as DataItems<TValue, TKey>;
}

/**
 * Pull and remove a value from data.
 *
 * @param data - The data to pull from
 * @param key - The key to pull
 * @param defaultValue - Default value if key doesn't exist
 * @returns Object with the pulled value and modified data, matching the delegate's own result
 *
 * @example
 *
 * dataPull([1, 2, 3], 1, 'default'); -> {value: 2, data: [1, 3]}
 * dataPull({a: 1, b: 2}, 'b', 'default'); -> {value: 2, data: {a: 1}}
 */
export const dataPull = dispatch(arrPull, objPull);

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
export const dataQuery = dispatch(arrQuery, objQuery);

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
export const dataRandom = dispatch(arrRandom, objRandom);

/**
 * Search for a value in data and return its key.
 *
 * @param items - The data items to search
 * @param value - The value or callback to search for
 * @param strict - Whether to use strict comparison
 * @returns The key of the found item or false
 */
// Overload: list backing, whose key is the index
export function dataSearch<TValue>(
    items: readonly TValue[],
    value: TValue | string | number | ((item: TValue, key: number) => boolean),
    strict?: boolean,
): number | false;
// Overload: keyed backing, whose key is the record's own
export function dataSearch<TValue, TKey extends PropertyKey>(
    items: Record<TKey, TValue>,
    value: TValue | string | number | ((item: TValue, key: TKey) => boolean),
    strict?: boolean,
): TKey | false;
// Overload: the package's own canonical input, whose list half answers an index
export function dataSearch<TValue, TKey extends PropertyKey>(
    items: DataItems<TValue, TKey>,
    value: TValue | string | number | ((item: TValue, key: TKey) => boolean),
    strict?: boolean,
): TKey | number | false;
// Implementation
export function dataSearch<TValue, TKey extends PropertyKey = PropertyKey>(
    items: DataItems<TValue, TKey>,
    value: TValue | string | number | ((item: TValue, key: TKey) => boolean),
    strict: boolean = false,
): TKey | number | false {
    // No Arr/Collection delegate exists for this function, so a Map is normalized here directly.
    const entries = isKeyedData(items)
        ? Object.entries(toKeyedData<TKey, TValue>(items))
        : Object.entries(arrWrap(items));

    for (const [key, item] of entries) {
        const actualKey = entriesKeyValue(key) as TKey;

        if (isFunction(value)) {
            if (value(item as TValue, actualKey)) {
                return actualKey;
            }

            continue;
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
// Overload: list backing, whose key is the index
export function dataBefore<TValue>(
    items: readonly TValue[],
    value: TValue | string | number | ((item: TValue, key: number) => boolean),
    strict?: boolean,
): TValue | null;
// Overload: keyed backing, whose key is the record's own
export function dataBefore<TValue, TKey extends PropertyKey>(
    items: Record<TKey, TValue>,
    value: TValue | string | number | ((item: TValue, key: TKey) => boolean),
    strict?: boolean,
): TValue | null;
// Overload: the package's own canonical input, which either half satisfies
export function dataBefore<TValue, TKey extends PropertyKey>(
    items: DataItems<TValue, TKey>,
    value: TValue | string | number | ((item: TValue, key: TKey) => boolean),
    strict?: boolean,
): TValue | null;
// Implementation
export function dataBefore<TValue, TKey extends PropertyKey = PropertyKey>(
    items: DataItems<TValue, TKey>,
    value: TValue | string | number | ((item: TValue, key: TKey) => boolean),
    strict: boolean = false,
): TValue | null {
    const key = dataSearch(items, value, strict);

    if (key === false) {
        return null;
    }

    // No Arr/Collection delegate exists for this function, so a Map is normalized here directly.
    const entries = isKeyedData(items)
        ? Object.entries(toKeyedData<TKey, TValue>(items))
        : Object.entries(arrWrap(items));
    const position = entries.findIndex(
        ([entryKey]) => entriesKeyValue(entryKey) === key,
    );

    if (position === 0) {
        return null;
    }

    return (entries[position - 1] as [string, TValue])[1];
}

/**
 * Get the item after a specified value in data.
 *
 * @param items - The data items to search
 * @param value - The value or callback to search for
 * @param strict - Whether to use strict comparison
 * @returns The item after the found item or null
 */
// Overload: list backing, whose key is the index
export function dataAfter<TValue>(
    items: readonly TValue[],
    value: TValue | string | number | ((item: TValue, key: number) => boolean),
    strict?: boolean,
): TValue | null;
// Overload: keyed backing, whose key is the record's own
export function dataAfter<TValue, TKey extends PropertyKey>(
    items: Record<TKey, TValue>,
    value: TValue | string | number | ((item: TValue, key: TKey) => boolean),
    strict?: boolean,
): TValue | null;
// Overload: the package's own canonical input, which either half satisfies
export function dataAfter<TValue, TKey extends PropertyKey>(
    items: DataItems<TValue, TKey>,
    value: TValue | string | number | ((item: TValue, key: TKey) => boolean),
    strict?: boolean,
): TValue | null;
// Implementation
export function dataAfter<TValue, TKey extends PropertyKey = PropertyKey>(
    items: DataItems<TValue, TKey>,
    value: TValue | string | number | ((item: TValue, key: TKey) => boolean),
    strict: boolean = false,
): TValue | null {
    const key = dataSearch(items, value, strict);

    if (key === false) {
        return null;
    }

    // No Arr/Collection delegate exists for this function, so a Map is normalized here directly.
    const entries = isKeyedData(items)
        ? Object.entries(toKeyedData<TKey, TValue>(items))
        : Object.entries(arrWrap(items));
    const position = entries.findIndex(
        ([entryKey]) => entriesKeyValue(entryKey) === key,
    );

    if (position === entries.length - 1) {
        return null;
    }

    return (entries[position + 1] as [string, TValue])[1];
}

/**
 * Get and remove the first N items from the data, mutating it in place.
 * Delegates to arrShift/objShift, which agree on the mutation contract:
 * negative count throws, an empty source returns null for any count, a
 * count of zero returns an empty array, then items are shifted off.
 *
 * @param items - The data to shift from. Mutated in place for an array or record backing; a Set or
 * generator backing is materialized first, so the write lands on the copy and is discarded.
 * @param count - Number of items to shift
 * @returns The shifted item(s), or null if the source had nothing to shift.
 * @throws Error if count is negative.
 */
export const dataShift = dispatch(arrShift, objShift);

/**
 * Set a value in data by key.
 *
 * @param data - The data to set value in
 * @param key - The key to set
 * @param value - The value to set
 * @returns Data with the value set, matching the delegate's own result
 *
 * @example
 *
 * dataSet([1, 2, 3], 1, 'new'); -> [1, 'new', 3]
 * dataSet({a: 1, b: 2}, 'c', 3); -> {a: 1, b: 2, c: 3}
 */
export const dataSet = dispatch(arrSet, objSet);

/**
 * Push values to data.
 *
 * @param data - The data to push to
 * @param key - The key to push to (for objects)
 * @param values - The values to push
 * @returns Data with pushed values, matching the delegate's own result
 *
 * @example
 *
 * dataPush([1, 2], null, [3, 4]); -> [1, 2, 3, 4]
 * dataPush({a: [1, 2]}, 'a', [3, 4]); -> {a: [1, 2, 3, 4]}
 */
export const dataPush = dispatch(arrPush, objPush);

/**
 * Prepend one or more items to the beginning of the data items, mutating
 * it in place. Delegates to arrUnshift/objUnshift, which both mutate.
 *
 * @param data - The data to unshift to. Mutated in place for an array or record backing; a Set or
 * generator backing is materialized first, so the write lands on the copy and is discarded.
 * @param items - The items to prepend
 * @returns The same data reference, mutated — or, for a Set or generator backing, the copy.
 */
export const dataUnshift = dispatch(arrUnshift, objUnshift);

/**
 * Shuffle data randomly.
 *
 * @param data - The data to shuffle
 * @returns Shuffled data
 *
 * @example
 *
 * dataShuffle([1, 2, 3, 4]); -> [3, 1, 4, 2] (random order)
 * dataShuffle({a: 1, b: 2, c: 3}); -> {0: 3, 1: 1, 2: 2} (random order, reindexed 0..n-1)
 */
export const dataShuffle = dispatch(arrShuffle, objShuffle);

/**
 * Slice the underlying data items
 *
 * @param data - The data to slice
 * @param offset - The starting index
 * @param length - The number of items to include
 * @returns Sliced data
 */
export const dataSlice = dispatch(arrSlice, objSlice);

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
export const dataSole = dispatch(arrSole, objSole);

/**
 * Sort data using a callback.
 *
 * @param data - The data to sort
 * @param callback - The value extractor callback or key to sort by
 * @returns Sorted data, matching the delegate's own result
 *
 * @example
 *
 * dataSort([3, 1, 4, 2]); -> [1, 2, 3, 4]
 * dataSort({c: 3, a: 1, b: 2}); -> {a: 1, b: 2, c: 3}
 */
export const dataSort = dispatch(arrSort, objSort);

/**
 * Sort data in descending order using a callback.
 *
 * @param data - The data to sort
 * @param callback - The comparison callback or key to sort by
 * @returns Sorted data in descending order, matching the delegate's own result
 *
 * @example
 *
 * dataSortDesc([1, 3, 2, 4]); -> [4, 3, 2, 1]
 * dataSortDesc({a: 1, c: 3, b: 2}); -> {c: 3, b: 2, a: 1}
 */
export const dataSortDesc = dispatch(arrSortDesc, objSortDesc);

/**
 * Sort data recursively.
 *
 * @param data - The data to sort recursively
 * @param descending - Whether to sort in descending order
 * @returns Recursively sorted data, matching the delegate's own result
 *
 * @example
 *
 * dataSortRecursive({b: {y: 2, x: 1}, a: {z: 3, w: 4}}); -> {a: {w: 4, z: 3}, b: {x: 1, y: 2}}
 */
export const dataSortRecursive = dispatch(arrSortRecursive, objSortRecursive);

/**
 * Sort data recursively in descending order.
 *
 * @param data - The data to sort recursively
 * @returns Recursively sorted data in descending order, matching the delegate's own result
 *
 * @example
 *
 * dataSortRecursiveDesc({a: {w: 4, z: 3}, b: {x: 1, y: 2}}); -> {b: {y: 2, x: 1}, a: {z: 3, w: 4}}
 */
export const dataSortRecursiveDesc = dispatch(
    arrSortRecursiveDesc,
    objSortRecursiveDesc,
);

/**
 * Splice a portion of the data items, mutating it in place. Delegates to
 * arrSplice/objSplice, which both mutate and return only what was removed —
 * obj keeps the removed entries' own keys, arr reindexes positionally.
 *
 * @param data - The data to splice. Mutated in place for an array or record backing; a Set or
 * generator backing is materialized first, so the write lands on the copy and is discarded.
 * @param offset - The starting index
 * @param length - The number of items to remove. Defaults to everything
 * from offset to the end.
 * @param replacement - The items to insert
 * @returns The removed items.
 */
export const dataSplice = dispatch(arrSplice, objSplice);

/**
 * Get a string value from data.
 *
 * @param data - The data to get from
 * @param key - The key to get
 * @param defaultValue - Default string value, `null` when omitted, as in PHP
 * @returns String value or default
 *
 * @example
 *
 * dataString(['hello', 'world'], 0, ''); -> 'hello'
 * dataString({name: 'John'}, 'name', ''); -> 'John'
 */
export const dataString = dispatch(arrString, objString);

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
export const dataToCssClasses = dispatch(arrToCssClasses, objToCssClasses);

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
export const dataToCssStyles = dispatch(arrToCssStyles, objToCssStyles);

/**
 * Filter data where callback returns true.
 *
 * @param data - The data to filter
 * @param callback - The test function
 * @returns Filtered data, matching the delegate's own result
 *
 * @example
 *
 * dataWhere([1, 2, 3, 4], (value) => value > 2); -> [3, 4]
 * dataWhere({a: 1, b: 2, c: 3}, (value) => value > 1); -> {b: 2, c: 3}
 */
export const dataWhere = dispatch(arrWhere, objWhere);

/**
 * Replace the data items with the given items.
 *
 * `data`'s backing picks the helper, and `replacerData` may be a list or an object on either
 * backing, as `array_replace` takes any two arrays. A list backing stays a list while the result's
 * keys are `0..n-1`; a string key or a gap makes it an object, as PHP's result is keyed then.
 * A `null`/`undefined` `replacerData` is a no-op (`EnumeratesValues.php:1121`).
 *
 * Not a `dispatch(arrReplace, objReplace)` pair on purpose: `arr.replace` returns `TValue[]`, so
 * it drops a string key and fills a gap with `undefined`, where `array_replace` keeps both.
 * obj serves the list backing so both backings answer what PHP answers.
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
    if (isKeyedData(data)) {
        return objReplace(
            toKeyedData<TKey, TValue>(data),
            replacerData,
        ) as DataItems<TValue, TKey>;
    }

    // array_replace keeps a list only while the replacer's keys extend it as 0..n-1; otherwise PHP's result is keyed.
    return listWhenIndexed(
        // DataItems dispatch can't carry obj's per-shape type; the data type pass replaces this cast.
        objReplace({ ...arrWrap(data) }, replacerData) as Record<
            string,
            TValue
        >,
    ) as DataItems<TValue, TKey>;
}

/**
 * Recursively replace the data items with the given items recursively.
 *
 * `data`'s backing picks the helper and `replacerData` may take either shape, and a list backing
 * becomes an object for a keyed result, as for `dataReplace` above. A `null`/`undefined`
 * `replacerData` is a no-op.
 *
 * Not a `dispatch` pair for the same reason as `dataReplace`: `arr.replaceRecursive` returns
 * `TValue[]`, which cannot hold the string key or the gap `array_replace_recursive` keeps.
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
    if (isKeyedData(data)) {
        return objReplaceRecursive(
            toKeyedData<TKey, TValue>(data),
            // DataItems dispatch can't carry obj's per-shape type; the data type pass replaces this cast.
            replacerData as Record<PropertyKey, TValue> | null | undefined,
        ) as DataItems<TValue, TKey>;
    }

    // As in dataReplace, a replacer key that leaves the list's keys other than 0..n-1 makes PHP's result keyed.
    return listWhenIndexed(
        objReplaceRecursive(
            { ...arrWrap(data) },
            // DataItems dispatch can't carry obj's per-shape type; the data type pass replaces this cast.
            replacerData as Record<PropertyKey, TValue> | null | undefined,
        ),
    ) as DataItems<TValue, TKey>;
}

/**
 * Filter data where callback returns false.
 *
 * @param data - The data to filter
 * @param callback - The test function
 * @returns Filtered data (rejected items), matching the delegate's own result
 *
 * @example
 *
 * dataReject([1, 2, 3, 4], (value) => value > 2); -> [1, 2]
 * dataReject({a: 1, b: 2, c: 3}, (value) => value > 1); -> {a: 1}
 */
export const dataReject = dispatch(arrReject, objReject);

/**
 * Reverse the data items.
 *
 * @param data - The data to reverse
 * @returns Reversed data
 */
export const dataReverse = dispatch(arrReverse, objReverse);

/**
 * Pad data to the specified length with a value.
 *
 * @param data - The data to pad
 * @param size - The desired size
 * @param value - The value to pad with
 * @returns Padded data
 */
export const dataPad = dispatch(arrPad, objPad);

/**
 * Partition data into two groups based on callback.
 *
 * @param data - The data to partition
 * @param callback - The test function
 * @returns Array with two groups: [passing, failing], matching the delegate's own result
 *
 * @example
 *
 * dataPartition([1, 2, 3, 4], (value) => value > 2); -> [[3, 4], [1, 2]]
 * dataPartition({a: 1, b: 2, c: 3}, (value) => value > 1); -> [{b: 2, c: 3}, {a: 1}]
 */
export const dataPartition = dispatch(arrPartition, objPartition);

/**
 * Filter out null values from data.
 *
 * @param data - The data to filter
 * @returns Data with null values removed, matching the delegate's own result
 *
 * @example
 *
 * dataWhereNotNull([1, null, 2, null, 3]); -> [1, 2, 3]
 * dataWhereNotNull({a: 1, b: null, c: 2}); -> {a: 1, c: 2}
 */
export const dataWhereNotNull = dispatch(arrWhereNotNull, objWhereNotNull);

/**
 * Get all values from data (array or object).
 *
 * @param data - The data to get values from
 * @returns Array of all values, matching the delegate's own result
 *
 * @example
 *
 * Data.values([1, 2, 3]); -> [1, 2, 3]
 * Data.values({a: 1, b: 2, c: 3}); -> [1, 2, 3]
 */
export const dataValues = dispatch(arrValues, objValues);

/**
 * Get all keys from data (array or object).
 *
 * @param data - The data to get keys from
 * @returns Array of all keys, matching the delegate's own result
 *
 * @example
 *
 * Data.keys([1, 2, 3]); -> [0, 1, 2]
 * Data.keys({a: 1, b: 2, c: 3}); -> ['a', 'b', 'c']
 */
export const dataKeys = dispatch(arrKeys, objKeys);

/**
 * Filter data using a callback function.
 *
 * @param data - The data to filter
 * @param callback - The callback function to test each value
 * @returns Filtered data, matching the delegate's own result
 *
 * @example
 *
 * Data.filter([1, 2, 3, 4], (value) => value > 2); -> [3, 4]
 * Data.filter({a: 1, b: 2, c: 3, d: 4}, (value) => value > 2); -> {c: 3, d: 4}
 */
export const dataFilter = dispatch(arrFilter, objFilter);

/**
 * Transform data using a callback function.
 *
 * @param data - The data to map
 * @param callback - The callback function to transform each value
 * @returns Transformed data, matching the delegate's own result
 *
 * @example
 *
 * dataMap([1, 2, 3], (value) => value * 2); -> [2, 4, 6]
 * dataMap({a: 1, b: 2}, (value) => value * 2); -> {a: 2, b: 4}
 */
export const dataMap = dispatch(arrMap, objMap);

/**
 * Get the first value from data that passes a test.
 *
 * @param data - The data to search
 * @param callback - The callback function to test each value
 * @param defaultValue - The default value to return if no match found
 * @returns The first matching value or default value
 *
 * @remarks A Map backing widens the callback's value parameter to `unknown`.
 *
 * @example
 *
 * dataFirst([1, 2, 3, 4], (value) => value > 2); -> 3
 * dataFirst({a: 1, b: 2, c: 3}, (value) => value > 1); -> 2
 * dataFirst(new Map([['a', 1], ['b', 2]])); -> 1
 */
// A Set or generator reaches `arrFirst` UNREAD via `toPositionalData`, so a callback-less call
// answers an infinite generator; given a callback `arrFirst` materialises, so that form still
// needs a finite backing.
export const dataFirst = dispatch(arrFirst, objFirst, toPositionalData);

/**
 * Get the last value from data that passes a test.
 *
 * @param data - The data to search
 * @param callback - The callback function to test each value
 * @param defaultValue - The default value to return if no match found
 * @returns The last matching value or default value
 *
 * @remarks A Map backing widens the callback's value parameter to `unknown`.
 *
 * @example
 *
 * Data.last([1, 2, 3, 4], (value) => value < 4); -> 3
 * Data.last({a: 1, b: 2, c: 3}, (value) => value > 1); -> 3
 * Data.last(new Map([['a', 1], ['b', 2]])); -> 2
 */
// A Set or generator reaches `arrLast` UNREAD via `toPositionalData`, but `last` has to walk to
// the end whatever it is handed, so the backing must still be finite.
export const dataLast = dispatch(arrLast, objLast, toPositionalData);

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
export const dataContains = dispatch(arrContains, objContains);

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
export const dataDiff = dispatch(arrDiff, objDiff);

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
export const dataDiffAssoc = dispatch(arrDiffAssoc, objDiffAssoc);

/**
 * Diff data with the given other data using a callback for key comparison.
 * Compares keys using the callback and values using PHP's `(string)` cast rule.
 * For arrays, obj's algorithm runs over the indices, so `other` is read through
 * `arrayableItems` and the survivors are reindexed.
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
    if (isKeyedData(data)) {
        return objDiffAssocUsing(
            toKeyedData<TKey, TValue>(data),
            other as Record<TKey, TValue>,
            // DataItems dispatch can't carry obj's per-shape type; the data type pass replaces this cast.
            callback as (
                keyA: string | number,
                keyB: string | number,
            ) => boolean,
        ) as DataItems<TValue, TKey>;
    }

    // A list's keys are its indices, so array_diff_uassoc over an index-keyed copy is the list case.
    return Object.values(
        objDiffAssocUsing(
            { ...arrWrap(data) },
            other,
            // DataItems dispatch can't carry obj's per-shape type; the data type pass replaces this cast.
            callback as (
                keyA: string | number,
                keyB: string | number,
            ) => boolean,
        ),
    ) as DataItems<TValue>;
}

/**
 * Diff data keys with the given other data using a callback for key comparison only.
 * Compares keys using the callback and ignores values completely.
 * For arrays, obj's algorithm runs over the indices, so `other` is read through
 * `arrayableItems` and the survivors are reindexed.
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
    if (isKeyedData(data)) {
        return objDiffKeysUsing(
            toKeyedData<TKey, TValue>(data),
            other as Record<TKey, TValue>,
            // DataItems dispatch can't carry obj's per-shape type; the data type pass replaces this cast.
            callback as (
                keyA: string | number,
                keyB: string | number,
            ) => boolean,
        ) as DataItems<TValue, TKey>;
    }

    // A list's keys are its indices, so array_diff_ukey over an index-keyed copy is the list case.
    return Object.values(
        objDiffKeysUsing(
            { ...arrWrap(data) },
            other,
            // DataItems dispatch can't carry obj's per-shape type; the data type pass replaces this cast.
            callback as (
                keyA: string | number,
                keyB: string | number,
            ) => boolean,
        ),
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
export const dataPluck = dispatch(arrPluck, objPluck);

/**
 * Get and remove the last N items from the data, mutating it in place.
 * Delegates to arrPop/objPop, which both mutate and agree on returning the
 * popped item(s) in reverse order for a count greater than one.
 *
 * @param data - The data to pop from. Mutated in place for an array or record backing; a Set or
 * generator backing is materialized first, so the write lands on the copy and is discarded.
 * @param count - The number of items to pop
 * @returns The popped item(s), or null if the source had nothing to pop.
 */
export const dataPop = dispatch(arrPop, objPop);

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
export const dataIntersect = dispatch(arrIntersect, objIntersect);

/**
 * Intersect the data with the given items with additional key check.
 * Returns items where both the key AND value match.
 *
 * `data`'s backing picks the helper, and `other` may be a list or an object on either backing,
 * as `array_intersect_assoc` takes any two arrays. A `null`/`undefined` `other` is treated as empty.
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
export const dataIntersectAssoc = dispatch(
    arrIntersectAssoc,
    objIntersectAssoc,
);

/**
 * Intersect the data with the given items with additional key check, using the callback.
 * The callback is used to compare keys, while values are compared by PHP's `(string)` cast rule.
 * `other` may be a list or an object on either backing.
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
export const dataIntersectAssocUsing = dispatch(
    arrIntersectAssocUsing,
    objIntersectAssocUsing,
);

/**
 * Intersect the data with the given items by key.
 * `other` may be a list or an object on either backing, as `array_intersect_key` takes any two arrays.
 *
 * @param data - The original data
 * @param items - The items to intersect with
 * @returns The intersected data
 */
export const dataIntersectByKeys = dispatch(
    arrIntersectByKeys,
    objIntersectByKeys,
);
