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
    diffAssocUsing as arrDiffAssocUsing,
    diffKeysUsing as arrDiffKeysUsing,
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
import type {
    DataItems,
    MapData,
    MapEntryKey,
    MapEntryValue,
    PathKey,
    UndotArrayKey,
    UndotValue,
} from "@tolki/types";
import {
    isArray,
    isFunction,
    isMap,
    isNull,
    isUndefined,
    keyedEntries,
    looseEqual,
    phpArrayKey,
    strictEqual,
} from "@tolki/utils";

import {
    copyKeyedData,
    dispatch,
    isKeyedData,
    streamPositionalData,
    toKeyedData,
    toPositionalBacking,
} from "./dispatch";

/**
 * A note on most of the `as` casts below: each function here dispatches a loose
 * `DataItems<TValue, TKey>` union to a stricter `@tolki/arr`/`@tolki/obj`
 * implementation via `isObject()`, which can't narrow the union's generics.
 * Widening happens at this dispatch boundary, not by loosening `obj`/`arr`'s own
 * return types. Some casts carry their own comment for a more specific reason.
 */

/**
 * Hand back a list backing's result as a list while PHP's keys run `0..n-1` in order, otherwise as the object.
 *
 * PHP appends each key the operand adds in the operand's own order, so `['a'] + [2 => 'c', 1 => 'b']` is keyed
 * although its keys are `0..2`: they run `0, 2, 1`.
 *
 * @param items - The result, keyed as obj's helpers key a list's copy.
 * @param list - The list the operand was added to.
 * @param operand - The operand added to it, as the caller passed it.
 * @returns The result's values when PHP's keys run `0..n-1` in order, otherwise the result itself.
 */
function listWhenIndexed<TValue>(
    items: Record<string, TValue>,
    list: object,
    operand: unknown,
): TValue[] | Record<string, TValue> {
    // A list or record operand adds integer keys ascending, as the result lists them; a Map adds them in its own order.
    // Object.keys, not Object.hasOwn, which would count an array's "length" as a held key.
    const listKeys = Object.keys(list);
    const held = new Set(listKeys);
    const keys = isMap(operand)
        ? [
              ...listKeys,
              ...keyedEntries(operand)
                  .map(([key]) => key)
                  .filter((key) => !held.has(key)),
          ]
        : Object.keys(items);

    return keys.every((key, index) => key === String(index))
        ? Object.values(items)
        : items;
}

/**
 * Copy a list backing into the record obj's helpers walk, keeping every index it declares.
 *
 * @param backing - The list backing, which may be sparse.
 * @returns A record of its indices, a hole included as the `undefined` `arr.union` fills it with.
 */
function toIndexedRecord(backing: ArrayLike<unknown>): Record<string, unknown> {
    // `{ ...list }` copies own keys only, so a hole would vanish and shorten the answer.
    return { ...Array.from(backing) };
}

/** What `listWhenIndexed` can answer: the delegate's own record, or that record's values. */
type ListWhenIndexed<TRecord> = TRecord | TRecord[keyof TRecord][];

/** A read-only list resolves to `unknown[]`, which it is not assignable to, so `DataAdd` rejects it. */
type MutableBacking<T> = T extends readonly unknown[] ? unknown[] : unknown;

/** The backings `dispatch` wraps into a one-element list: everything that is not an object. */
type NonObjectBacking =
    | string
    | number
    | bigint
    | boolean
    | symbol
    | null
    | undefined;

/**
 * `dataAdd`'s rows, each answering with its delegate's own return type.
 *
 * One shape is turned away: a backing the compiler has **not narrowed** (`unknown`), which no
 * typed row can claim. Relaxing that has to be a deliberate widening, not a side effect.
 *
 * A read-only list is accepted, and answers `arr.add`'s own row: `arr.add` copies along the
 * written path instead of writing through, so the read-only rejection was only ever a shape of
 * `MutableBacking`, which now guards the `unknown` row alone.
 *
 * Every other backing every sibling write helper takes is accepted here: a Map, a Set, a list, a
 * record, an interface, a class instance, and a scalar, string or nullish value.
 */
interface DataAdd {
    (
        data: ReadonlyMap<PropertyKey, unknown>,
        key: PathKey,
        value: unknown,
    ): ReturnType<typeof objAdd>;
    (
        data: NonObjectBacking,
        key: PathKey,
        value: unknown,
    ): ReturnType<typeof objAdd>;
    // A Set is typed from obj's widest row, as it is on every sibling helper, even though
    // `dispatch` materializes it and answers from `arr.add`. Part B owns closing that gap.
    (
        data: ReadonlySet<unknown>,
        key: PathKey,
        value: unknown,
    ): ReturnType<typeof objAdd>;
    <TValue, TAddValue>(
        data: readonly TValue[],
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
 * @param data - The data to add to. A backing the compiler has not narrowed is rejected; see `DataAdd`
 * @param key - The key to add at
 * @param value - The value to add
 * @returns New data with the element added, matching the delegate's own result
 *
 * @example
 *
 * dataAdd([1, 2], 2, 3); -> [1, 2, 3]
 * dataAdd({a: 1}, 'b', 2); -> {a: 1, b: 2}
 */
export const dataAdd: DataAdd = dispatch(
    arrAdd,
    objAdd,
    toPositionalBacking,
    toKeyedData,
);

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
 * dataItem({items: {x: 1, y: 2}}, 'items'); -> {x: 1, y: 2}
 */
export const dataItem = dispatch(
    arrayItem,
    objectItem,
    toPositionalBacking,
    toKeyedData,
);

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
export const dataBoolean = dispatch(
    arrBoolean,
    objBoolean,
    toPositionalBacking,
    toKeyedData,
);

/**
 * Chunk the data into chunks of the given size.
 *
 * A Map is chunked in its insertion order, so each chunk holds the entries PHP's would.
 *
 * @param data - The data to chunk
 * @param size - The size of each chunk
 * @param preserveKeys - Whether to keep each entry's own key instead of reindexing the chunk.
 *   The default follows the backing: `false` for a list, whose keys are already just indices,
 *   and `true` for a keyed backing, whose keys carry meaning.
 * @returns Chunked data
 *
 * @example
 *
 * dataChunk([1, 2, 3], 2); -> [[1, 2], [3]]
 * dataChunk(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), 2, false); -> { 0: { 0: 'c', 1: 'a' }, 1: { 0: 'b' } }
 */
export const dataChunk = dispatch(arrChunk, objChunk);

/**
 * Chunk the data into chunks with a callback.
 *
 * A Map is walked in its insertion order, so the callback sees its entries in PHP's order.
 *
 * @param data - The data to chunk
 * @param callback - Receives the value, its key and the chunk built so far; return true to keep appending
 * @returns Chunked data
 *
 * @remarks A Map backing widens the callback's value parameter to `unknown`. Its chunk is a plain object, integer keys
 * first, so `Object.values(chunk).at(-1)` is PHP's `$chunk->last()` only when the key added last is also listed last.
 *
 * @example
 *
 * dataChunkWhile([1, 1, 2], (value, index, chunk) => chunk.at(-1) === value); -> [[1, 1], [2]]
 * dataChunkWhile({ a: 1, b: 1, c: 2 }, (value, key, chunk) => Object.values(chunk).at(-1) === value);
 * -> { 0: { a: 1, b: 1 }, 1: { c: 2 } }
 * dataChunkWhile(new Map([[2, 'c'], [0, 'a']]), () => false); -> { 0: { 2: 'c' }, 1: { 0: 'a' } }
 */
export const dataChunkWhile = dispatch(arrChunkWhile, objChunkWhile);

/**
 * Chunk the data into chunks by comparing adjacent values using the given key or callback.
 *
 * A Map is walked in its insertion order, so the items compared as adjacent are PHP's.
 *
 * @param data - The data to chunk
 * @param key - A path into each item, or a callback receiving the value and its key
 * @returns Chunked data
 *
 * @example
 *
 * dataChunkBy([1, 1, 2], (value) => value); -> [[1, 1], [2]]
 * dataChunkBy({ a: 1, b: 1, c: 2 }, (value) => value); -> { 0: { a: 1, b: 1 }, 1: { c: 2 } }
 * dataChunkBy(new Map([[2, 1], [0, 1], [1, 2]]), (value) => value); -> { 0: { 0: 1, 2: 1 }, 1: { 1: 2 } }
 */
export const dataChunkBy = dispatch(arrChunkBy, objChunkBy);

/**
 * Collapse nested data into a single level.
 *
 * A Map's items are merged in its insertion order, so the integer keys are renumbered and
 * the last string key wins as PHP's `array_merge` does. A Map among the items is skipped.
 *
 * @param data - The data to collapse
 * @returns Collapsed data
 *
 * @example
 *
 * dataCollapse([[1, 2], [3, 4]]); -> [1, 2, 3, 4]
 * dataCollapse({a: {x: 1, y: 2}, b: {z: 3}}); -> {x: 1, y: 2, z: 3}
 * dataCollapse(new Map([[2, ['c']], [0, ['a']]])); -> {0: 'c', 1: 'a'}
 */
export const dataCollapse = dispatch(arrCollapse, objCollapse);

/** The value each delegate answers with for the call `dataCombine` actually makes it. */
type ArrCombineRow<TKeys, TValues> = ReturnType<
    typeof arrCombine<TKeys, TValues>
>;
/** obj is handed the backing's VALUES, never the backing, so its row is keyed on `TKeys[]`. */
type ObjCombineRow<TKeys, TValues> = ReturnType<
    typeof objCombine<TKeys[], DataItems<TValues>>
>;

/**
 * `dataCombine`'s keys backing. `undefined` is excluded: `toPositionalBacking` keeps it as a
 * one-element list — the difference from `streamPositionalData` that `dispatch.spec` pins — so
 * `array_combine` would reject every values set but a one-element one.
 */
type CombineKeysBacking = string | number | bigint | boolean | symbol | null;

/**
 * `dataUndot`'s positional backings — every shape `isKeyedData` sends to `Arr.undot`.
 * `undefined` belongs here too: `toPositionalBacking` keeps it as a one-element list.
 */
type UndotPositionalBacking = CombineKeysBacking | undefined;

/**
 * Combine two data sets: the first set's values become the keys, the second set's values the values.
 * Either set may be a list or an object, as `array_combine` takes any two arrays.
 *
 * A Map and a record go to `obj.combine`; a list, a Set, a generator and a scalar go to
 * `arr.combine`, which is where `isKeyedData` sends each of them at runtime.
 *
 * @param itemsA - The first data set
 * @param itemsB - The second data set
 * @returns Combined data set
 *
 * @example
 *
 * dataCombine(['a', 'b'], [1, 2]); -> {a: 1, b: 2}
 * dataCombine(new Map([[2, 'c'], [0, 'a']]), ['x', 'y']); -> {c: 'x', a: 'y'}
 */
export function dataCombine<TKeys, TValues>(
    itemsA: ReadonlyMap<PropertyKey, TKeys>,
    itemsB: DataItems<TValues>,
): ObjCombineRow<TKeys, TValues>;
export function dataCombine<TKeys, TValues>(
    itemsA: TKeys[],
    itemsB: DataItems<TValues>,
): ArrCombineRow<TKeys, TValues>;
export function dataCombine<TKeys, TValues>(
    itemsA: Record<PropertyKey, TKeys>,
    itemsB: DataItems<TValues>,
): ObjCombineRow<TKeys, TValues>;
export function dataCombine<TKeys, TValues>(
    itemsA: Iterable<TKeys> | CombineKeysBacking,
    itemsB: DataItems<TValues>,
): ArrCombineRow<TKeys, TValues>;
export function dataCombine<TKeys, TValues>(
    itemsA: DataItems<TKeys> | ReadonlyMap<PropertyKey, TKeys> | unknown,
    itemsB: DataItems<TValues>,
) {
    // No dispatch pair serves this, so the keys backing is normalized the way dispatch would.
    if (isKeyedData(itemsA)) {
        // Collection::combine keys by $this->all(), which never unwraps; handing obj a list keeps it from doing so.
        // keyedEntries keeps a Map's insertion order, which the record toKeyedData builds would lose.
        return objCombine(
            keyedEntries<TKeys>(itemsA as object).map(([, value]) => value),
            itemsB,
        );
    }

    return arrCombine(toPositionalBacking(itemsA) as TKeys[], itemsB);
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

    // Object.values sees nothing on a Set or generator, so normalize first, exactly as
    // `dispatch` does for every sibling: a Set or generator is materialized to its elements.
    return (toPositionalBacking(data) as unknown[]).length;
}

/**
 * Cross join data with other data.
 *
 * When `data` is keyed, every argument is read by key, a Map's keys as dimensions in its insertion order; each row
 * keeps its keys where PHP's spread renumbers integer ones `0..n-1`. When `data` is a list, every argument is one
 * dimension, so a later Map or record gives its values, not its keys.
 *
 * @param data - The data to cross join
 * @param others - Other data to join with
 * @returns Cross joined data
 *
 * @example
 *
 * dataCrossJoin([1, 2], [3, 4]); -> [[1, 3], [1, 4], [2, 3], [2, 4]]
 * dataCrossJoin(new Map([['b', [1, 2]]]), new Map([['a', ['x']]])); -> [{b: 1, a: 'x'}, {b: 2, a: 'x'}]
 * dataCrossJoin([1, 2], new Map([['a', ['x', 'y']]])); -> [[1, ['x', 'y']], [2, ['x', 'y']]]
 */
export const dataCrossJoin = dispatch(arrCrossJoin, objCrossJoin);

/**
 * Divide data into keys and values.
 *
 * @param data - The data to divide
 * @returns Array with keys and values, matching the delegate's own result
 *
 * @remarks JS-only: a JS object hoists integer-like keys ahead of string ones, so a mixed-key
 * record divides into a different PAIR ORDER than PHP's, though the key types still match.
 * A Map keeps its insertion order, so it divides in PHP's order.
 *
 * @example
 *
 * dataDivide([1, 2, 3]); -> [[0, 1, 2], [1, 2, 3]]
 * dataDivide({a: 1, b: 2}); -> [['a', 'b'], [1, 2]]
 * dataDivide(new Map([['x', 1], [0, 2]])); -> [['x', 0], [1, 2]]
 */
export const dataDivide = dispatch(arrDivide, objDivide);

/**
 * Convert data to dot notation.
 *
 * A Map is flattened in its insertion order, a nested Map kept whole as a value. The result is a plain object, so the
 * integer-like keys an empty or all-digit prefix can leave are listed first, ascending, not in PHP's order.
 *
 * @param data - The data to convert
 * @param prepend - String to prepend to keys
 * @param depth - Maximum depth to flatten. Defaults to Infinity.
 * @returns Data in dot notation, matching the delegate's own result
 *
 * @example
 *
 * dataDot({a: {b: 1, c: 2}}); -> {'a.b': 1, 'a.c': 2}
 * dataDot(new Map([[2, 'c'], [0, 'a']]), 'p.'); -> {'p.2': 'c', 'p.0': 'a'}
 * dataDot(new Map([[2, 'c'], [0, 'a']]), '1'); -> {10: 'a', 12: 'c'} (PHP: [12 => 'c', 10 => 'a'])
 */
export const dataDot = dispatch(arrDot, objDot);

/**
 * Convert dot notation back to nested data.
 *
 * Read in insertion order, a Map's key written last wins; `asArray` skips a dotted key through an earlier scalar.
 *
 * @param data - The dot notation data object to convert
 * @param asArray - Force array-shaped rebuilding (`Arr.undot`) instead of the
 *   object-shaped one. JS-only ergonomics with no PHP counterpart; throws if any
 *   key's dot segments aren't all non-negative integers.
 * @returns Nested data structure, matching the delegate the chosen branch calls
 * @throws TypeError via `Arr.undot` when `asArray` is set and a key is not an index path.
 *
 * @example
 *
 * dataUndot({'a.b': 1, 'a.c': 2}); -> {a: {b: 1, c: 2}}
 * dataUndot(new Map<string | number, string>([['0.a', 'y'], [0, 'x']])); -> {0: 'x'}
 * dataUndot(new Map([[1, 'p'], ['1.0', 'y']]), true); -> [, 'p'] (PHP: [1 => ['y']])
 */
export function dataUndot(
    data: ReadonlyMap<unknown, unknown>,
    asArray?: false | undefined,
): ReturnType<typeof objUndot>;
// A number key holds no dot, so with asArray each of this Map's values lands whole in the list.
export function dataUndot<TValue>(
    data: ReadonlyMap<number, TValue>,
    asArray: true,
): TValue[];
export function dataUndot<TMap>(
    data: MapData<TMap>,
    asArray: true,
): UndotValue<MapEntryValue<TMap>>[];
export function dataUndot<TMap>(
    data: MapData<TMap>,
    asArray: boolean,
): ReturnType<typeof objUndot> | UndotValue<MapEntryValue<TMap>>[];
export function dataUndot<TValue>(
    data: readonly TValue[] | Iterable<TValue> | UndotPositionalBacking,
    asArray?: boolean,
): ReturnType<typeof arrUndot<TValue, number>>;
export function dataUndot<TData extends object>(
    data: TData,
    asArray?: false | undefined,
): ReturnType<typeof objUndot<TData>>;
export function dataUndot<TValue, TKey extends UndotArrayKey>(
    data: Record<TKey, TValue>,
    asArray: true | undefined,
): ReturnType<typeof arrUndot<TValue, TKey>>;
export function dataUndot(
    data: unknown,
    asArray?: boolean,
): ReturnType<typeof objUndot>;
export function dataUndot<TValue, TKey extends PropertyKey>(
    data: DataItems<TValue, TKey> | unknown,
    asArray: boolean = false,
): unknown {
    // No dispatch pair serves this, so the backing is normalized the way dispatch would: a Map or record goes on as it
    // arrived, and a scalar, string or Traversable becomes a list. isObject would send a Set or a generator down the
    // keyed branch, which reads them as empty.
    if (isKeyedData(data)) {
        // Widen: `asArray` routes object-backed data to `Arr.undot`, which rejects
        // non-numeric-first keys — `dataUndot`'s own contract is broader; `Arr.undot`'s
        // runtime guard is what catches a bad key instead.
        return asArray
            ? arrUndot(data as Record<UndotArrayKey, TValue>)
            : objUndot(data as Record<TKey, TValue>);
    }

    return arrUndot(toPositionalBacking(data) as Record<UndotArrayKey, TValue>);
}

/**
 * Union multiple objects or arrays items into one, the way PHP's `+` does.
 *
 * The first item that isn't nullish is the backing, and each other item may be a list or an object. A list backing
 * stays a list while every item extends its keys as `0..n-1` in order, and otherwise becomes an object, as PHP's is.
 * Not a `dispatch` pair: `arr.union` drops a non-integer-like key and fills a gap with `undefined`, which `+` does not.
 *
 * @param items - the data items to union
 * @return A new object or array containing all values
 *
 * @example
 *
 * dataUnion(['a'], new Map([[1, 'b'], [2, 'c']])); -> ['a', 'b', 'c']
 * dataUnion(['a'], new Map([[2, 'c'], [1, 'b']])); -> {0: 'a', 1: 'b', 2: 'c'}
 */
export function dataUnion<TValue>(
    ...items: (
        | TValue[]
        | Record<PropertyKey, TValue>
        // `unknown`, not `TValue`: a Map matches BOTH rows (it is an `Iterable<[K, V]>`),
        // which left `TValue` ambiguous — tsc resolved it one way for the repo program and
        // another for vitest's. Both are materialized before use, so neither types the result.
        | ReadonlyMap<PropertyKey, unknown>
        | Iterable<unknown>
        | NonObjectBacking
    )[]
) {
    // A nullish operand is `(array) null` in PHP: empty, and no evidence about the backing.
    const [backing = [], ...operands] = items.filter(
        (item) => !isNull(item) && !isUndefined(item),
    ) as (TValue[] | Record<PropertyKey, TValue>)[];

    // No dispatch pair serves this, so the backing is normalized here. A Map backing can become a record: `+` keeps
    // the same value for a key in any order, and the result is a record either way.
    if (isKeyedData(backing)) {
        return objUnion(toKeyedData<PropertyKey, TValue>(backing), ...operands);
    }

    return operands.reduce<TValue[] | Record<PropertyKey, TValue>>(
        (result, operand) => {
            const merged = objUnion(result, operand);

            // Keys PHP inserted out of order or after a gap can't be a list, even once later operands fill it.
            return isArray(result)
                ? listWhenIndexed(merged, result, operand)
                : merged;
        },
        // Array.from, as toIndexedRecord uses for the other three list backings: a
        // TRAILING hole declares no own key, so arr.union alone would shorten the answer
        // where the dense list it stands for keeps its length.
        arrUnion(Array.from(toPositionalBacking(backing) as ArrayLike<TValue>)),
    );
}

/**
 * Get all data except specified keys.
 *
 * @param data - The source data
 * @param keys - Keys to exclude
 * @returns Data without specified keys, matching the delegate's own result
 *
 * @remarks JS-only: a list backing RENUMBERS, because a JS array cannot hold a sparse integer
 * key; the keys PHP preserves are observable on the object backing.
 *
 * @example
 *
 * dataExcept([1, 2, 3, 4], [1, 3]); -> [1, 3] (indices 0 and 2)
 * dataExcept({a: 1, b: 2, c: 3}, ['b']); -> {a: 1, c: 3}
 */
export const dataExcept = dispatch(
    arrExcept,
    objExcept,
    toPositionalBacking,
    toKeyedData,
);

/**
 * Get all data except for specified values.
 *
 * @param data - The data to filter
 * @param values - The values to exclude
 * @param strict - Whether to use strict comparison
 * @returns Data without specified values, matching the delegate's own result
 *
 * @remarks JS-only: a list backing RENUMBERS, because a JS array cannot hold a sparse integer
 * key; the keys PHP preserves are observable on the object backing.
 *
 * @example
 *
 * dataExceptValues(['foo', 'bar', 'baz'], ['foo', 'baz']); -> ['bar']
 * dataExceptValues({name: 'taylor', age: 26}, [26]); -> {name: 'taylor'}
 */
export const dataExceptValues = dispatch(
    arrExceptValues,
    objExceptValues,
    toPositionalBacking,
    toKeyedData,
);

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
export const dataExists = dispatch(
    arrExists,
    objExists,
    toPositionalBacking,
    toKeyedData,
);

/**
 * Take a limited number of items from data.
 *
 * A Map is counted in its insertion order, so the items taken are the ones PHP's array takes.
 *
 * @param data - The data to take from
 * @param limit - Number of items to take
 * @returns Limited data
 *
 * @remarks JS-only: a list backing RENUMBERS, because a JS array cannot hold a sparse integer
 * key; the keys PHP preserves are observable on the object backing.
 *
 * @example
 *
 * dataTake([1, 2, 3, 4, 5], 3); -> [1, 2, 3]
 * dataTake({a: 1, b: 2, c: 3, d: 4}, 2); -> {a: 1, b: 2}
 * dataTake(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), 2); -> {2: 'c', 0: 'a'}
 */
export const dataTake = dispatch(arrTake, objTake);

/**
 * Flatten nested data to a specified depth.
 *
 * A Map's values are read in its insertion order; a Map nested inside is kept as a value.
 *
 * @param data - The data to flatten
 * @param depth - The depth to flatten to
 * @returns Flattened data
 *
 * @example
 *
 * dataFlatten([[1, 2], [3, [4, 5]]], 1); -> [1, 2, 3, [4, 5]]
 * dataFlatten({a: {b: {c: 1}}}, 1); -> [{c: 1}]
 * dataFlatten(new Map([[2, ['c']], [0, 'a']])); -> ['c', 'a']
 */
export const dataFlatten = dispatch(arrFlatten, objFlatten);

/**
 * Flip the keys and values of an object or array.
 *
 * A Map is flipped in its insertion order, so when two keys hold the same value, the key
 * PHP reaches last is the one kept.
 *
 * @param data - The data of items to flip
 * @return - the data items flipped, matching the delegate's own result
 *
 * @example
 *
 * dataFlip(['a', 'b']); -> {a: 0, b: 1}
 * dataFlip(new Map([[2, 'v'], [0, 'v']])); -> {v: 0}
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
export const dataFloat = dispatch(
    arrFloat,
    objFloat,
    toPositionalBacking,
    toKeyedData,
);

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
export const dataForget = dispatch(
    arrForget,
    objForget,
    toPositionalBacking,
    toKeyedData,
);

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
export const dataFrom = dispatch(
    arrFrom,
    objFrom,
    (items) => items,
    toKeyedData,
);

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
export const dataGet = dispatch(
    arrGet,
    objGet,
    toPositionalBacking,
    toKeyedData,
);

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
export const dataHas = dispatch(
    arrHas,
    objHas,
    toPositionalBacking,
    toKeyedData,
);

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
export const dataHasAll = dispatch(
    arrHasAll,
    objHasAll,
    toPositionalBacking,
    toKeyedData,
);

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
export const dataHasAny = dispatch(
    arrHasAny,
    objHasAny,
    toPositionalBacking,
    toKeyedData,
);

/**
 * Test if every item in data passes a test.
 *
 * A Map's keys are cast as PHP casts an array key, so the keys PHP stores as one (`1` and `"1"`) are visited once.
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
 * dataEvery(new Map([['2', 'c'], ['0', 'a']]), (value, key) => typeof key === 'number'); -> true
 * dataEvery(new Set([2, 4]), (value) => value % 2 === 0); -> true
 */
// A Set or generator must reach `arrEvery` UNREAD, so an infinite generator still answers;
// this normalises with `streamPositionalData` rather than the materialising default.
export const dataEvery = dispatch(arrEvery, objEvery, streamPositionalData);

/**
 * Test if some items in data pass a test.
 *
 * A Map's keys are cast as PHP casts them, so the keys PHP stores as one (`1` and `"1"`) are one item, the last value.
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
 * dataSome(new Map([[1, 'a'], ['1', 'b']]), (value) => value === 'a'); -> false
 * dataSome(new Set([1, 3]), (value) => value > 2); -> true
 */
// A Set or generator must reach `arrSome` UNREAD, so an infinite generator still answers;
// this normalises with `streamPositionalData` rather than the materialising default.
export const dataSome = dispatch(arrSome, objSome, streamPositionalData);

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
export const dataInteger = dispatch(
    arrInteger,
    objInteger,
    toPositionalBacking,
    toKeyedData,
);

/**
 * Join data elements with a glue string.
 *
 * A Map is joined in its insertion order, the order PHP's array was written in, which a record
 * loses once its integer keys are out of sequence.
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
 * dataJoin(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), ', ', ' and '); -> 'c, a and b'
 */
export const dataJoin = dispatch(arrJoin, objJoin);

/**
 * Key data by a given key or callback.
 *
 * A Map is walked in its insertion order, so the callback sees its items in PHP's order, and
 * when two items resolve to the same key, the one PHP reaches last is the one kept.
 *
 * @param data - The data to key
 * @param keyBy - Key or callback to key by; the callback receives each item and its key (a list's index)
 * @returns Keyed data, matching the delegate's own result
 *
 * @example
 *
 * dataKeyBy([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}], 'id');
 * -> {1: {id: 1, name: 'John'}, 2: {id: 2, name: 'Jane'}}
 * dataKeyBy(new Map([[2, {id: 'r'}], [0, {id: 'p'}]]), 'id'); -> {r: {id: 'r'}, p: {id: 'p'}}
 */
export const dataKeyBy = dispatch(arrKeyBy, objKeyBy);

/**
 * Prepend keys with a given prefix.
 *
 * A Map is walked in its insertion order. The result is a plain object, so the integer-like keys an empty prefix or
 * one starting with a digit from 1 to 9 can leave are listed first, ascending, not in PHP's order.
 *
 * @param data - The data to prepend keys to
 * @param prependWith - The prefix to prepend
 * @returns Data with prepended keys, matching the delegate's own result
 *
 * @example
 *
 * dataPrependKeysWith({name: 'John', age: 30}, 'user_');
 * -> {user_name: 'John', user_age: 30}
 * dataPrependKeysWith(new Map([[2, 'c'], [0, 'a']]), 'k'); -> {k2: 'c', k0: 'a'}
 * dataPrependKeysWith(new Map([['x', 1], [2, 'c'], [0, 'a']]), '1'); -> {10: 'a', 12: 'c', '1x': 1}
 */
export const dataPrependKeysWith = dispatch(
    arrPrependKeysWith,
    objPrependKeysWith,
);

/**
 * Get only specified keys from data.
 *
 * A keyed backing's items come back in its own order (a Map's insertion order), not in the order of `keys`.
 *
 * @param data - The data to get from
 * @param keys - Keys to include
 * @returns Data with only specified keys, matching the delegate's own result
 *
 * @remarks JS-only: a list backing RENUMBERS, because a JS array cannot hold a sparse integer
 * key; the keys PHP preserves are observable on the object backing.
 *
 * @example
 *
 * dataOnly([1, 2, 3, 4], [0, 2]); -> [1, 3]
 * dataOnly({a: 1, b: 2, c: 3}, ['a', 'c']); -> {a: 1, c: 3}
 * dataOnly(new Map([['b', 1], [0, 2], ['a', 3]]), ['a', 'b']); -> {b: 1, a: 3}
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
 * @remarks JS-only: a list backing RENUMBERS, because a JS array cannot hold a sparse integer
 * key; the keys PHP preserves are observable on the object backing.
 *
 * @example
 *
 * dataOnlyValues(['foo', 'bar', 'baz'], ['foo', 'baz']); -> ['foo', 'baz']
 * dataOnlyValues({name: 'taylor', age: 26}, [26]); -> {age: 26}
 */
export const dataOnlyValues = dispatch(
    arrOnlyValues,
    objOnlyValues,
    toPositionalBacking,
    toKeyedData,
);

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
export const dataSelect = dispatch(
    arrSelect,
    objSelect,
    toPositionalBacking,
    toKeyedData,
);

/**
 * Map data with keys using a callback.
 *
 * Not a `dispatch` pair: the callback's tuple return has to be normalized to a single-pair
 * record before either delegate folds it, and `dispatch` forwards its arguments untouched.
 *
 * A Map is walked in its insertion order, which orders the string keys returned and decides who wins a shared key.
 *
 * @param data - The data to map
 * @param callback - The mapping callback
 * @returns Mapped data with keys
 *
 * @example
 *
 * dataMapWithKeys([1, 2], (value, index) => [`key_${String(index)}`, value * 2]);
 * -> {key_0: 2, key_1: 4}
 * dataMapWithKeys(new Map([[2, 'c'], [0, 'a']]), (value, key) => [`k${key}`, value]); -> {k2: 'c', k0: 'a'}
 */
// The tuple row comes first: one row taking `[K, V] | Record<K, V>` would read a tuple as a record
// too, and infer V as the union of every member the array has.
export function dataMapWithKeys<
    TMap,
    TMapWithKeysKey extends PropertyKey,
    TMapWithKeysValue,
>(
    data: MapData<TMap>,
    callback: (
        value: MapEntryValue<TMap>,
        key: MapEntryKey<TMap>,
    ) => readonly [TMapWithKeysKey, TMapWithKeysValue],
): Record<TMapWithKeysKey, TMapWithKeysValue>;
export function dataMapWithKeys<
    TMap,
    TMapWithKeysKey extends PropertyKey,
    TMapWithKeysValue,
>(
    data: MapData<TMap>,
    callback: (
        value: MapEntryValue<TMap>,
        key: MapEntryKey<TMap>,
    ) => Record<TMapWithKeysKey, TMapWithKeysValue>,
): Record<TMapWithKeysKey, TMapWithKeysValue>;
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
): Record<TMapWithKeysKey, TMapWithKeysValue>;
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
    // The callback may return a `[key, value]` tuple or a `Record<K, V>`, but both delegates
    // fold with `Object.entries`, which reads a tuple as `{0: key, 1: value}`. A tuple is
    // normalized to a single-pair Record here, so the two branches cannot drift apart.
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

    // isKeyedData, not isObject: a Set and a generator are objects but positional, and obj
    // would read no entries off either. A Map goes on as it arrived, for obj to read in insertion order.
    if (isKeyedData(data)) {
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
        toPositionalBacking(data) as TValue[],
        (value: TValue, index: number) =>
            normalizedCallback(value, index as TKey),
    ) as Record<TMapWithKeysKey, TMapWithKeysValue>;
}

/**
 * Map data by spreading array items to callback.
 *
 * A Map is walked in its insertion order, so the callback sees its rows in PHP's order.
 *
 * @param data - The data to map
 * @param callback - The mapping callback
 * @returns Mapped data, matching the delegate's own result
 *
 * @example
 *
 * dataMapSpread([[1, 2], [3, 4]], (a, b) => a + b); -> [3, 7]
 * dataMapSpread(new Map([[2, ['c', 1]], [0, ['a', 2]]]), (x) => x + ++calls); -> {2: 'c1', 0: 'a2'}
 */
export const dataMapSpread = dispatch(arrMapSpread, objMapSpread);

/**
 * Prepend a value to data.
 *
 * A Map is read in its insertion order, and without a key its integer keys are renumbered in that order, as
 * `array_unshift` renumbers PHP's.
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
 * dataPrepend(new Map([[2, 'c'], [0, 'a']]), 'z'); -> {0: 'z', 1: 'c', 2: 'a'}
 */
// A Map always comes back as the plain record obj.prepend builds, keyed as PHP stores each key.
export function dataPrepend<TMap, V>(
    data: MapData<TMap>,
    value: V,
    ...rest: [key?: PropertyKey | null]
): Record<string, MapEntryValue<TMap> | V>;
export function dataPrepend<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    value: TValue,
    ...rest: [key?: PropertyKey | null]
): DataItems<TValue, TKey>;
export function dataPrepend<TValue, TKey extends PropertyKey = PropertyKey>(
    data: DataItems<TValue, TKey>,
    value: TValue,
    ...rest: [key?: PropertyKey | null]
): DataItems<TValue, TKey> {
    // Not a dispatch pair: `arr.prepend` takes `key?: number` and returns `TValue[]`, so it cannot express PHP's keyed
    // answer.
    if (isKeyedData(data)) {
        return objPrepend(
            data as Record<TKey, TValue>,
            value,
            ...rest,
        ) as DataItems<TValue, TKey>;
    }

    const backing = toPositionalBacking(data) as TValue[];

    if (rest.length === 0) {
        return arrPrepend(backing, value) as DataItems<TValue>;
    }

    // [$key => $value] + $list starts with the key, so it stays a list only when the key casts to 0.
    const prepended = objPrepend(toIndexedRecord(backing), value, ...rest);

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
export const dataPull = dispatch(
    arrPull,
    objPull,
    toPositionalBacking,
    toKeyedData,
);

/**
 * Convert data to a query string.
 *
 * A Map is read in its insertion order, so its pairs come out in the order PHP's
 * `http_build_query` writes them. A Map nested inside keyed data is read the same way.
 *
 * @param data - The data to convert
 * @returns Query string representation
 *
 * @example
 *
 * dataQuery({name: 'John', age: 30}); -> 'name=John&age=30'
 * dataQuery([1, 2, 3]); -> '0=1&1=2&2=3'
 * dataQuery(new Map([[2, 'c'], [0, 'a'], [1, 'b']])); -> '2=c&0=a&1=b'
 */
export const dataQuery = dispatch(arrQuery, objQuery);

/**
 * Get random elements from data.
 *
 * Which elements are picked is random, but they come back in the data's own order, as PHP's
 * picks do. A Map's order is its insertion order.
 *
 * @param data - The data to get random elements from
 * @param number - Number of elements to get
 * @param preserveKeys - Whether to preserve keys
 * @returns Random elements
 *
 * @example
 *
 * dataRandom([1, 2, 3, 4], 2); -> [2, 4] (random selection, in the list's order)
 * dataRandom({a: 1, b: 2, c: 3}, 1); -> {0: 2} (random, reindexed)
 * dataRandom({a: 1, b: 2, c: 3}, 1, true); -> {b: 2} (random, keys kept)
 * dataRandom(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), 3); -> {0: 'c', 1: 'a', 2: 'b'}
 */
export const dataRandom = dispatch(arrRandom, objRandom);

/**
 * Read the entries `dataSearch`, `dataBefore` and `dataAfter` walk, in the order PHP walks the array.
 *
 * A Map keeps its insertion order, which a record cannot; the keys PHP stores as one (`1` and `"1"`) become one entry,
 * where the first stood, holding the last value.
 *
 * @param items - The data to read.
 * @returns Its `[key, value]` pairs in order, each key a string as `Object.entries` reports one.
 */
function searchableEntries<TValue>(items: unknown): [string, TValue][] {
    return isKeyedData(items)
        ? keyedEntries<TValue>(items as object)
        : Object.entries(toPositionalBacking(items) as TValue[]);
}

/**
 * Find the key of the first entry that matches, the way `Collection::search` does.
 *
 * @param entries - The entries to walk, in order.
 * @param value - The value or callback to search for.
 * @param strict - Whether to use strict comparison.
 * @returns The key PHP stores for the first match, or false.
 */
function searchEntries<TValue, TKey extends PropertyKey>(
    entries: readonly [string, TValue][],
    value: TValue | string | number | ((item: TValue, key: TKey) => boolean),
    strict: boolean,
): TKey | number | false {
    for (const [key, item] of entries) {
        const actualKey = phpArrayKey(key) as TKey;

        if (isFunction(value)) {
            if (value(item, actualKey)) {
                return actualKey;
            }

            continue;
        }

        // PHP's array_search uses PHP's own ===/==, which compare arrays by value.
        // JavaScript's compare by reference, so a literal needle could never match.
        if (strict) {
            if (strictEqual(item, value)) {
                return actualKey;
            }

            continue;
        }

        if (looseEqual(item, value)) {
            return actualKey;
        }
    }

    return false;
}

/**
 * Search for a value in data and return its key.
 *
 * No `Arr::` counterpart or delegate pair, so it is written out after `Collection::search`. A Map is searched in its
 * insertion order, so the first match and the keys a callback is handed follow PHP's order.
 *
 * @param items - The data items to search
 * @param value - The value or callback to search for
 * @param strict - Whether to use strict comparison
 * @returns The found item's key, the index for a list or a numeric-string-keyed record, or false
 *
 * @remarks Comparison follows PHP's `===`/`==`, so an array or object needle matches by value.
 *
 * @example
 *
 * dataSearch([1, 2, 3], 2); -> 1
 * dataSearch({a: 1, b: 2}, 2); -> 'b'
 * dataSearch(new Map([[2, 'x'], [0, 'x'], [1, 'y']]), 'x'); -> 2
 * dataSearch(new Map<string | number, number>([['x', 1], [0, 2], ['y', 3]]), () => true); -> 'x'
 */
// Overload: a Map, whose callback is handed its values and the keys PHP stores
export function dataSearch<TMap>(
    items: MapData<TMap>,
    value:
        | MapEntryValue<TMap>
        | string
        | number
        | ((item: MapEntryValue<TMap>, key: MapEntryKey<TMap>) => boolean),
    strict?: boolean,
): MapEntryKey<TMap> | false;
// Overload: list backing, whose key is the index
export function dataSearch<TValue>(
    items: readonly TValue[],
    value: TValue | string | number | ((item: TValue, key: number) => boolean),
    strict?: boolean,
): number | false;
// Overload: keyed backing, whose numeric-string key comes back as a number
export function dataSearch<TValue, TKey extends PropertyKey>(
    items: Record<TKey, TValue>,
    value: TValue | string | number | ((item: TValue, key: TKey) => boolean),
    strict?: boolean,
): TKey | number | false;
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
    return searchEntries(searchableEntries<TValue>(items), value, strict);
}

/**
 * Get the item before a specified value in data.
 *
 * No `Arr::` counterpart or delegate pair, so it is written out after `Collection::before`. A Map is read in its
 * insertion order, and the match's key is found with PHP's LOOSE `$keys->search($key)` whatever `strict` says, so
 * an earlier key loosely equal to it (`'01'` and `1`) is the one whose neighbour is returned.
 *
 * @param items - The data items to search
 * @param value - The value or callback to search for
 * @param strict - Whether to use strict comparison
 * @returns The item before the first key loosely equal to the found item's key, or null
 *
 * @example
 *
 * dataBefore([1, 2, 3], 2); -> 1
 * dataBefore(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), 'a'); -> 'c'
 * dataBefore(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), 'c'); -> null
 * dataBefore(new Map([['01', 'a'], [1, 'b']]), 'b'); -> null
 */
// Overload: a Map, whose callback is handed its values and the keys PHP stores
export function dataBefore<TMap>(
    items: MapData<TMap>,
    value:
        | MapEntryValue<TMap>
        | string
        | number
        | ((item: MapEntryValue<TMap>, key: MapEntryKey<TMap>) => boolean),
    strict?: boolean,
): MapEntryValue<TMap> | null;
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
    // Read ONCE: a generator is single-use, and the search and the position lookup must walk the same entries.
    const entries = searchableEntries<TValue>(items);
    const key = searchEntries(entries, value, strict);

    if (key === false) {
        return null;
    }

    // PHP finds that key's position with a LOOSE `$keys->search($key)`, whatever `$strict` says,
    // so the key 1 is found at an earlier key '01' that `==` holds equal to it.
    const position = entries.findIndex(([entryKey]) =>
        looseEqual(phpArrayKey(entryKey), key),
    );

    if (position === 0) {
        return null;
    }

    return (entries[position - 1] as [string, TValue])[1];
}

/**
 * Get the item after a specified value in data.
 *
 * No `Arr::` counterpart or delegate pair, so it is written out after `Collection::after`. A Map is read in its
 * insertion order, and the match's key is found with PHP's LOOSE `$keys->search($key)` whatever `strict` says, so
 * an earlier key loosely equal to it (`'01'` and `1`) is the one whose neighbour is returned.
 *
 * @param items - The data items to search
 * @param value - The value or callback to search for
 * @param strict - Whether to use strict comparison
 * @returns The item after the first key loosely equal to the found item's key, or null
 *
 * @example
 *
 * dataAfter([1, 2, 3], 2); -> 3
 * dataAfter(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), 'c'); -> 'a'
 * dataAfter(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), 'b'); -> null
 * dataAfter(new Map([['01', 'a'], [1, 'b']]), 'b'); -> 'b'
 */
// Overload: a Map, whose callback is handed its values and the keys PHP stores
export function dataAfter<TMap>(
    items: MapData<TMap>,
    value:
        | MapEntryValue<TMap>
        | string
        | number
        | ((item: MapEntryValue<TMap>, key: MapEntryKey<TMap>) => boolean),
    strict?: boolean,
): MapEntryValue<TMap> | null;
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
    // Read ONCE: a generator is single-use, and the search and the position lookup must walk the same entries.
    const entries = searchableEntries<TValue>(items);
    const key = searchEntries(entries, value, strict);

    if (key === false) {
        return null;
    }

    // PHP finds that key's position with a LOOSE `$keys->search($key)`, whatever `$strict` says,
    // so the key 1 is found at an earlier key '01' that `==` holds equal to it.
    const position = entries.findIndex(([entryKey]) =>
        looseEqual(phpArrayKey(entryKey), key),
    );

    if (position === entries.length - 1) {
        return null;
    }

    return (entries[position + 1] as [string, TValue])[1];
}

/**
 * Get and remove the first N items from the data, mutating it in place.
 *
 * An empty source returns null for any count, and otherwise a count of zero returns an empty array.
 * A Map is shifted from the start of its insertion order.
 *
 * @param items - The data to shift from. Mutated in place for an array or record backing; a Map,
 * Set or generator backing is copied first, so the write lands on the copy and is discarded.
 * @param count - Number of items to shift
 * @returns The shifted item(s), or null if the source had nothing to shift.
 * @throws Error if count is negative.
 *
 * @example
 *
 * dataShift([1, 2, 3]); -> 1
 * dataShift(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), 2); -> ['c', 'a'], the Map left as it was
 */
export const dataShift = dispatch(
    arrShift,
    objShift,
    toPositionalBacking,
    copyKeyedData,
);

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
export const dataSet = dispatch(
    arrSet,
    objSet,
    toPositionalBacking,
    toKeyedData,
);

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
 * dataPush([1, 2], null, 3, 4); -> [1, 2, 3, 4]
 * dataPush({a: [1, 2]}, 'a', 3, 4); -> {a: [1, 2, 3, 4]}
 */
export const dataPush = dispatch(
    arrPush,
    objPush,
    toPositionalBacking,
    toKeyedData,
);

const unshiftBacking = dispatch(
    arrUnshift,
    objUnshift,
    toPositionalBacking,
    copyKeyedData,
);

/**
 * Prepend one or more items to the beginning of the data items, mutating it in place.
 *
 * A Map's integer keys are renumbered in its insertion order, so each value lands on the key PHP's unshift gives it.
 *
 * @param data - The data to unshift to. Mutated in place for an array or record backing; a Map,
 * Set or generator backing is copied first, so the write lands on the copy and is discarded.
 * @param items - The items to prepend
 * @returns The same data reference, mutated; for a Set or generator the copy, and for a Map a record built from it.
 *
 * @example
 *
 * dataUnshift([2, 3], 1); -> [1, 2, 3]
 * dataUnshift(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), 'U'); -> {0: 'U', 1: 'c', 2: 'a', 3: 'b'}
 */
export const dataUnshift = ((...args: readonly unknown[]): unknown => {
    const result = (unshiftBacking as (...args: readonly unknown[]) => unknown)(
        ...args,
    );

    // obj.unshift hands back the Map copy it rewrote; every other keyed answer here is a record.
    return isMap(result) ? objFrom(result) : result;
}) as typeof unshiftBacking;

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
export const dataShuffle = dispatch(
    arrShuffle,
    objShuffle,
    toPositionalBacking,
    toKeyedData,
);

/**
 * Slice the underlying data items
 *
 * A Map is sliced by its insertion order, so the offset and length count the items PHP's
 * array holds in that order.
 *
 * @param data - The data to slice
 * @param offset - The starting index
 * @param length - The number of items to include
 * @returns Sliced data
 *
 * @example
 *
 * dataSlice([1, 2, 3, 4], 1, 2); -> [2, 3]
 * dataSlice(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), 1); -> {0: 'a', 1: 'b'}
 */
export const dataSlice = dispatch(arrSlice, objSlice);

/**
 * Get the sole item that passes a test.
 *
 * A Map is read in its insertion order, and the keys PHP stores as one (`1` and `"1"`) count as one item.
 *
 * @param data - The data to search
 * @param callback - The test function
 * @returns The sole matching item
 * @throws Error if more than one or no items match
 *
 * @remarks JS-only: PHP's `ItemNotFoundException`/`MultipleItemsFoundException` have no JS
 * analogue, so `@tolki/utils` ships same-named `Error` subclasses in their place.
 *
 * @example
 *
 * dataSole([1, 2, 3], (value) => value > 2); -> 3
 * dataSole({a: 1, b: 2, c: 3}, (value) => value === 2); -> 2
 * dataSole(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), (value) => value === 'c'); -> 'c' (keys seen: 2, 0, 1)
 * dataSole(new Map([[1, 'a'], ['1', 'b']])); -> 'b'
 */
export const dataSole = dispatch(arrSole, objSole);

/**
 * Sort data using a callback.
 *
 * A Map is read in its insertion order, so ties and the callback's keys follow PHP's order; its integer keys are then
 * renumbered over the sorted sequence, as a record's are.
 *
 * @param data - The data to sort
 * @param callback - The value extractor callback or key to sort by
 * @returns Sorted data, matching the delegate's own result
 *
 * @example
 *
 * dataSort([3, 1, 4, 2]); -> [1, 2, 3, 4]
 * dataSort({c: 3, a: 1, b: 2}); -> {a: 1, b: 2, c: 3}
 * dataSort(new Map([[2, {n: 1, id: 'p'}], [0, {n: 1, id: 'q'}], [1, {n: 0, id: 'r'}]]), 'n');
 * -> {0: {n: 0, id: 'r'}, 1: {n: 1, id: 'p'}, 2: {n: 1, id: 'q'}}
 */
export const dataSort = dispatch(arrSort, objSort);

/**
 * Sort data in descending order using a callback.
 *
 * A Map is read in its insertion order, so ties and the callback's keys follow PHP's order; its integer keys are then
 * renumbered over the sorted sequence, as a record's are.
 *
 * @param data - The data to sort
 * @param callback - The comparison callback or key to sort by
 * @returns Sorted data in descending order, matching the delegate's own result
 *
 * @example
 *
 * dataSortDesc([1, 3, 2, 4]); -> [4, 3, 2, 1]
 * dataSortDesc({a: 1, c: 3, b: 2}); -> {c: 3, b: 2, a: 1}
 * dataSortDesc(new Map([[2, {n: 1, id: 'p'}], [0, {n: 1, id: 'q'}], [1, {n: 0, id: 'r'}]]), 'n');
 * -> {0: {n: 1, id: 'p'}, 1: {n: 1, id: 'q'}, 2: {n: 0, id: 'r'}}
 */
export const dataSortDesc = dispatch(arrSortDesc, objSortDesc);

/**
 * Sort data recursively.
 *
 * A Map backing is read in its insertion order, the order `array_is_list` walks, so a Map keyed
 * `1, 0` is not a list and is sorted by key, each key keeping its own value. A Map inside the
 * data is a value like any other object that is not a plain one, and is kept as it is.
 *
 * @param data - The data to sort recursively
 * @param descending - Whether to sort in descending order
 * @returns Recursively sorted data, matching the delegate's own result
 *
 * @example
 *
 * dataSortRecursive({b: {y: 2, x: 1}, a: {z: 3, w: 4}}); -> {a: {w: 4, z: 3}, b: {x: 1, y: 2}}
 * dataSortRecursive(new Map([[1, 'a'], [0, 'b']])); -> {0: 'b', 1: 'a'}
 */
export const dataSortRecursive = dispatch(arrSortRecursive, objSortRecursive);

/**
 * Sort data recursively in descending order.
 *
 * A Map backing is read in its insertion order, so one keyed `2, 0, 1` is not a list and is sorted by key.
 *
 * @param data - The data to sort recursively
 * @returns Recursively sorted data in descending order, matching the delegate's own result
 *
 * @remarks JS-only: a JS object lists integer-like keys first, ascending, whatever the sort produced, so only the
 * string keys' relative order, and which value each key holds, match PHP's.
 *
 * @example
 *
 * dataSortRecursiveDesc({a: {w: 4, z: 3}, b: {x: 1, y: 2}}); -> {b: {y: 2, x: 1}, a: {z: 3, w: 4}}
 * dataSortRecursiveDesc(new Map([[2, 'c'], [0, 'a'], [1, 'b']])); -> {0: 'a', 1: 'b', 2: 'c'}
 */
export const dataSortRecursiveDesc = dispatch(
    arrSortRecursiveDesc,
    objSortRecursiveDesc,
);

/**
 * Splice a portion of the data items, mutating it in place, and return only what was removed.
 *
 * A Map is spliced in its insertion order. What is removed keeps its string keys and renumbers integer keys from 0.
 *
 * @param data - The data to splice. Mutated in place for an array or record backing; a Map, Set
 * or generator backing is copied first, so the write lands on the copy and is discarded.
 * @param offset - The starting index
 * @param length - The number of items to remove. Defaults to everything
 * from offset to the end.
 * @param replacement - The items to insert
 * @returns The removed items.
 *
 * @example
 *
 * dataSplice([1, 2, 3, 4], 1, 2); -> [2, 3]
 * dataSplice(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), 1); -> {0: 'a', 1: 'b'}
 */
export const dataSplice = dispatch(
    arrSplice,
    objSplice,
    toPositionalBacking,
    copyKeyedData,
);

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
export const dataString = dispatch(
    arrString,
    objString,
    toPositionalBacking,
    toKeyedData,
);

/**
 * Convert data to CSS classes string.
 *
 * A Map is read in its insertion order, so its classes come out in the order PHP's array
 * lists them, integer keys and string keys interleaved as they were written.
 *
 * @param data - The data to convert
 * @returns CSS classes string
 *
 * @example
 *
 * dataToCssClasses(['btn', 'btn-primary']); -> 'btn btn-primary'
 * dataToCssClasses({btn: true, 'btn-primary': true, disabled: false}); -> 'btn btn-primary'
 * dataToCssClasses(new Map([[2, 'c2'], ['x', true], [0, 'c0']])); -> 'c2 x c0'
 */
export const dataToCssClasses = dispatch(arrToCssClasses, objToCssClasses);

/**
 * Convert data to CSS styles string.
 *
 * A Map is read in its insertion order, so its styles come out in the order PHP's array
 * lists them, integer keys and string keys interleaved as they were written.
 *
 * @param data - The data to convert
 * @returns CSS styles string
 *
 * @example
 *
 * dataToCssStyles(['color:red', 'font-size:14px']); -> 'color:red; font-size:14px;'
 * dataToCssStyles({'color:red': true, 'display:none': false}); -> 'color:red;'
 * dataToCssStyles(new Map([['x:1', true], [0, 'z:0'], ['y:1', true]])); -> 'x:1; z:0; y:1;'
 */
export const dataToCssStyles = dispatch(arrToCssStyles, objToCssStyles);

/**
 * Filter data where callback returns true.
 *
 * A Map is walked in its insertion order, so a callback that counts its calls keeps the items PHP keeps.
 *
 * @param data - The data to filter
 * @param callback - The test function
 * @returns Filtered data, matching the delegate's own result
 *
 * @remarks JS-only: a list backing RENUMBERS, because a JS array cannot hold a sparse integer
 * key; the keys PHP preserves are observable on the object backing.
 *
 * @example
 *
 * dataWhere([1, 2, 3, 4], (value) => value > 2); -> [3, 4]
 * dataWhere({a: 1, b: 2, c: 3}, (value) => value > 1); -> {b: 2, c: 3}
 * dataWhere(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), () => ++calls <= 2); -> {2: 'c', 0: 'a'}
 */
export const dataWhere = dispatch(arrWhere, objWhere);

/**
 * Replace the data items with the given items.
 *
 * `replacerData` may be a list or an object on either backing. A list backing stays a list while the result's keys run
 * `0..n-1` in order; a string key, a gap or a Map adding `2` before `1` makes it an object, as PHP's result is keyed.
 * Not a `dispatch` pair: `arr.replace` returns `TValue[]`, which drops a string key and fills a gap with `undefined`.
 *
 * @param data - The original data
 * @param replacerData - The items to replace with. `null`/`undefined` is a no-op.
 * @returns The replaced data, matching the delegate's own result
 *
 * @example
 *
 * dataReplace(['a', 'b'], new Map([[2, 'c'], [3, 'd']])); -> ['a', 'b', 'c', 'd']
 * dataReplace(['a', 'b'], new Map([[3, 'd'], [2, 'c']])); -> {0: 'a', 1: 'b', 2: 'c', 3: 'd'}
 */
export function dataReplace<TValue, TReplacer extends object = object>(
    data: readonly TValue[],
    replacerData: TReplacer | null | undefined,
): ListWhenIndexed<
    ReturnType<typeof objReplace<Record<string, TValue>, TReplacer>>
>;
export function dataReplace<TReplacer extends object = object>(
    data: ReadonlyMap<PropertyKey, unknown>,
    replacerData: TReplacer | null | undefined,
): ReturnType<typeof objReplace>;
export function dataReplace<
    TData extends object,
    TReplacer extends object = object,
>(
    data: TData,
    replacerData: TReplacer | null | undefined,
): ReturnType<typeof objReplace<TData, TReplacer>>;
export function dataReplace(
    data: unknown,
    replacerData: unknown,
): ReturnType<typeof objReplace>;
export function dataReplace<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TReplacerKey extends PropertyKey = PropertyKey,
>(
    data: DataItems<TValue, TKey> | unknown,
    replacerData: DataItems<TValue, TReplacerKey> | null | undefined | unknown,
): unknown {
    // A Map backing can become a record: array_replace keeps the same value for a key in any order, and the
    // result is a record either way.
    if (isKeyedData(data)) {
        return objReplace(toKeyedData<TKey, TValue>(data), replacerData);
    }

    const list = toIndexedRecord(toPositionalBacking(data) as unknown[]);

    // array_replace keeps a list only while the replacer's keys extend it as 0..n-1 in order; otherwise it is keyed.
    return listWhenIndexed(objReplace(list, replacerData), list, replacerData);
}

/**
 * Recursively replace the data items with the given items recursively.
 *
 * `replacerData` may take either shape, and a list backing becomes an object for a keyed result, as for `dataReplace`.
 * Not a `dispatch` pair for the same reason: `arr.replaceRecursive` returns `TValue[]`, which cannot hold PHP's keys.
 *
 * @param data - The original data
 * @param replacerData - The items to replace with. `null`/`undefined` is a no-op.
 * @returns The replaced data, matching the delegate's own result
 *
 * @example
 *
 * dataReplaceRecursive(['a'], new Map([[1, 'b'], [2, 'c']])); -> ['a', 'b', 'c']
 * dataReplaceRecursive(['a'], new Map([[2, 'c'], [1, 'b']])); -> {0: 'a', 1: 'b', 2: 'c'}
 */
export function dataReplaceRecursive<TValue, TReplacer extends object = object>(
    data: readonly TValue[],
    replacerData: TReplacer | null | undefined,
): ListWhenIndexed<
    ReturnType<typeof objReplaceRecursive<Record<string, TValue>, TReplacer>>
>;
export function dataReplaceRecursive<TReplacer extends object = object>(
    data: ReadonlyMap<PropertyKey, unknown>,
    replacerData: TReplacer | null | undefined,
): ReturnType<typeof objReplaceRecursive>;
export function dataReplaceRecursive<
    TData extends object,
    TReplacer extends object = object,
>(
    data: TData,
    replacerData: TReplacer | null | undefined,
): ReturnType<typeof objReplaceRecursive<TData, TReplacer>>;
export function dataReplaceRecursive(
    data: unknown,
    replacerData: unknown,
): ReturnType<typeof objReplaceRecursive>;
export function dataReplaceRecursive<
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(
    data: DataItems<TValue, TKey> | unknown,
    replacerData: DataItems<TValue, TKey> | null | undefined | unknown,
): unknown {
    // A Map backing becomes a record, for the reason dataReplace gives.
    if (isKeyedData(data)) {
        return objReplaceRecursive(
            toKeyedData<TKey, TValue>(data),
            replacerData,
        );
    }

    const list = toIndexedRecord(toPositionalBacking(data) as unknown[]);

    // As in dataReplace, a replacer key that leaves the keys other than 0..n-1 in order makes PHP's result keyed.
    return listWhenIndexed(
        objReplaceRecursive(list, replacerData),
        list,
        replacerData,
    );
}

/**
 * Filter data where callback returns false.
 *
 * A Map is walked in its insertion order, so a callback that counts its calls drops the items PHP drops.
 *
 * @param data - The data to filter
 * @param callback - The test function
 * @returns Filtered data (rejected items), matching the delegate's own result
 *
 * @remarks JS-only: the callback is REQUIRED — PHP's no-argument form drops every truthy value,
 * which no typed row expresses — and a list backing renumbers, since JS has no sparse key.
 *
 * @example
 *
 * dataReject([1, 2, 3, 4], (value) => value > 2); -> [1, 2]
 * dataReject({a: 1, b: 2, c: 3}, (value) => value > 1); -> {a: 1}
 * dataReject(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), () => ++calls <= 1); -> {0: 'a', 1: 'b'}
 */
export const dataReject = dispatch(arrReject, objReject);

/**
 * Reverse the data items.
 *
 * A Map is reversed from its insertion order, so its values come out in the order PHP's reversed array holds them.
 *
 * @param data - The data to reverse
 * @returns Reversed data
 *
 * @remarks JS-only: PHP keeps each value on its original integer key; a JS object cannot hold
 * a descending integer order, so an integer-keyed backing is reversed AND renumbered.
 *
 * @example
 *
 * dataReverse([1, 2, 3]); -> [3, 2, 1]
 * dataReverse(new Map([[2, 'c'], [0, 'a'], [1, 'b']])); -> {0: 'b', 1: 'a', 2: 'c'}
 */
export const dataReverse = dispatch(arrReverse, objReverse);

/**
 * Pad data to the specified length with a value.
 *
 * A Map is read in its insertion order, so its integer keys are renumbered in that order and
 * each value lands on the key PHP's padded array gives it.
 *
 * @param data - The data to pad
 * @param size - The desired size
 * @param value - The value to pad with
 * @returns Padded data
 *
 * @example
 *
 * dataPad([1, 2], 4, 0); -> [1, 2, 0, 0]
 * dataPad(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), 4, 'P'); -> {0: 'c', 1: 'a', 2: 'b', 3: 'P'}
 */
export const dataPad = dispatch(arrPad, objPad);

/**
 * Partition data into two groups based on callback.
 *
 * A Map is walked in its insertion order, so a callback that counts its calls puts each item on PHP's side.
 *
 * @param data - The data to partition
 * @param callback - The test function
 * @returns Array with two groups: [passing, failing], matching the delegate's own result
 *
 * @remarks JS-only: a list backing RENUMBERS, because a JS array cannot hold a sparse integer
 * key; the keys PHP preserves are observable on the object backing.
 *
 * @example
 *
 * dataPartition([1, 2, 3, 4], (value) => value > 2); -> [[3, 4], [1, 2]]
 * dataPartition({a: 1, b: 2, c: 3}, (value) => value > 1); -> [{b: 2, c: 3}, {a: 1}]
 * dataPartition(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), () => ++calls <= 1); -> [{2: 'c'}, {0: 'a', 1: 'b'}]
 */
export const dataPartition = dispatch(arrPartition, objPartition);

/**
 * Filter out null values from data.
 *
 * Of the Map keys PHP stores as one (`1` and `"1"`), only the last value is tested, so a `null` written last drops it.
 *
 * @param data - The data to filter
 * @returns Data with null values removed, matching the delegate's own result
 *
 * @remarks JS-only: PHP has one null, so the check matches `null` alone and an `undefined` value
 * survives; a list backing also renumbers, since a JS array has no sparse integer key.
 *
 * @example
 *
 * dataWhereNotNull([1, null, 2, null, 3]); -> [1, 2, 3]
 * dataWhereNotNull({a: 1, b: null, c: 2}); -> {a: 1, c: 2}
 * dataWhereNotNull(new Map([[1, 'a'], ['x', 'm'], ['1', null]])); -> {x: 'm'}
 */
export const dataWhereNotNull = dispatch(arrWhereNotNull, objWhereNotNull);

/**
 * Get all values from data (array or object).
 *
 * A Map's values come back in its insertion order, the order `array_values` lists them in.
 *
 * @param data - The data to get values from
 * @returns Array of all values, matching the delegate's own result
 *
 * @example
 *
 * dataValues([1, 2, 3]); -> [1, 2, 3]
 * dataValues({a: 1, b: 2, c: 3}); -> [1, 2, 3]
 * dataValues(new Map([[2, 'c'], [0, 'a'], [1, 'b']])); -> ['c', 'a', 'b']
 */
export const dataValues = dispatch(arrValues, objValues);

/**
 * Get all keys from data (array or object).
 *
 * A Map's keys come back in its insertion order, each the key PHP stores for it, where a
 * record would list its integer keys ascending.
 *
 * @param data - The data to get keys from
 * @returns Array of all keys, matching the delegate's own result
 *
 * @example
 *
 * dataKeys([1, 2, 3]); -> [0, 1, 2]
 * dataKeys({a: 1, b: 2, c: 3}); -> ['a', 'b', 'c']
 * dataKeys(new Map([[2, 'c'], [0, 'a'], [1, 'b']])); -> [2, 0, 1]
 */
export const dataKeys = dispatch(arrKeys, objKeys);

/**
 * Filter data using a callback function.
 *
 * A Map is walked in its insertion order, so a callback that counts its calls keeps the items PHP keeps.
 *
 * @param data - The data to filter
 * @param callback - The callback function to test each value
 * @returns Filtered data, matching the delegate's own result
 *
 * @example
 *
 * dataFilter([1, 2, 3, 4], (value) => value > 2); -> [3, 4]
 * dataFilter({a: 1, b: 2, c: 3, d: 4}, (value) => value > 2); -> {c: 3, d: 4}
 * dataFilter(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), () => ++calls <= 2); -> {2: 'c', 0: 'a'}
 */
export const dataFilter = dispatch(arrFilter, objFilter);

/**
 * Transform data using a callback function.
 *
 * A Map is walked in its insertion order, so the callback sees its items in PHP's order.
 *
 * @param data - The data to map
 * @param callback - The callback function to transform each value
 * @returns Transformed data, matching the delegate's own result
 *
 * @example
 *
 * dataMap([1, 2, 3], (value) => value * 2); -> [2, 4, 6]
 * dataMap({a: 1, b: 2}, (value) => value * 2); -> {a: 2, b: 4}
 * dataMap(new Map([[2, 'c'], [0, 'a']]), (value) => value + ++calls); -> {2: 'c1', 0: 'a2'}
 */
export const dataMap = dispatch(arrMap, objMap);

/**
 * Get the first value from data that passes a test.
 *
 * A Map is read in its insertion order, and the keys PHP stores as one (`1` and `"1"`) are one item, the last value.
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
 * dataFirst(new Map([[2, 'c'], [0, 'a'], [1, 'b']])); -> 'c'
 * dataFirst(new Map([[1, 'a'], ['1', 'b']])); -> 'b'
 */
// A Set or generator reaches `arrFirst` UNREAD via `streamPositionalData`, so a callback-less call
// answers an infinite generator; given a callback `arrFirst` materialises, so that form still
// needs a finite backing.
export const dataFirst = dispatch(arrFirst, objFirst, streamPositionalData);

/**
 * Get the last value from data that passes a test.
 *
 * A Map is read in its insertion order, and a `"1"` after a `1` changes that item's value but not its place.
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
 * dataLast([1, 2, 3, 4], (value) => value < 4); -> 3
 * dataLast({a: 1, b: 2, c: 3}, (value) => value > 1); -> 3
 * dataLast(new Map([['a', 1], ['b', 2]])); -> 2
 * dataLast(new Map([[2, 'c'], [0, 'a'], [1, 'b']])); -> 'b'
 * dataLast(new Map([[1, 'a'], [0, 'z'], ['1', 'b']])); -> 'z'
 */
// A Set or generator reaches `arrLast` UNREAD via `streamPositionalData`, but `last` has to walk to
// the end whatever it is handed, so the backing must still be finite.
export const dataLast = dispatch(arrLast, objLast, streamPositionalData);

/**
 * Determine if data contains a value.
 *
 * A Map is read in its insertion order, so a callback is handed its keys in the order PHP
 * walks the array. The order decides a strict callback search, whose first match must not be
 * null, and the keys PHP stores as one (`1` and `"1"`) hold only the last value.
 *
 * @param data - The data to search
 * @param value - The value to search for or callback function
 * @returns True if the value exists, false otherwise
 *
 * @example
 *
 * dataContains([1, 2, 3], 2); -> true
 * dataContains({a: 1, b: 2}, (value) => value > 1); -> true
 * dataContains(new Map([[2, null], [0, 'a']]), () => true, true); -> false (the first match is null)
 * dataContains(new Map([[1, 'a'], ['1', 'b']]), 'a'); -> false
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
 * dataDiff([1, 2, 3, 4], [2, 4]); -> [1, 3]
 */
export const dataDiff = dispatch(
    arrDiff,
    objDiff,
    toPositionalBacking,
    toKeyedData,
);

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
export const dataDiffAssoc = dispatch(
    arrDiffAssoc,
    objDiffAssoc,
    toPositionalBacking,
    toKeyedData,
);

/**
 * Diff data with the given other data using a callback for key comparison.
 * Compares keys using the callback and values using PHP's `(string)` cast rule.
 * A list's keys are its indices, so `other` is read through `arrayableItems` on
 * both backings and a list's survivors are reindexed.
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
export const dataDiffAssocUsing = dispatch(
    arrDiffAssocUsing,
    objDiffAssocUsing,
    toPositionalBacking,
    toKeyedData,
);

/**
 * Diff data keys with the given other data using a callback for key comparison only.
 * Compares keys using the callback and ignores values completely.
 * A list's keys are its indices, so `other` is read through `arrayableItems` on
 * both backings and a list's survivors are reindexed.
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
export const dataDiffKeysUsing = dispatch(
    arrDiffKeysUsing,
    objDiffKeysUsing,
    toPositionalBacking,
    toKeyedData,
);

/**
 * Pluck values from data by a key path.
 *
 * A Map is walked in its insertion order, so the list and both callbacks follow PHP's order, and of two items that
 * resolve to one key the last is kept. A keyed result is still a plain object, whose integer keys list ascending.
 *
 * @param data - The data to pluck from
 * @param value - The key path to pluck
 * @param key - Optional key path to use as keys in result
 * @returns Plucked values maintaining appropriate structure
 *
 * @example
 *
 * dataPluck([{name: 'John'}, {name: 'Jane'}], 'name'); -> ['John', 'Jane']
 * dataPluck({a: {name: 'John'}, b: {name: 'Jane'}}, 'name'); -> ['John', 'Jane']
 * dataPluck(new Map([[2, {n: 'c'}], [0, {n: 'a'}], [1, {n: 'b'}]]), 'n'); -> ['c', 'a', 'b']
 */
export const dataPluck = dispatch(arrPluck, objPluck);

/**
 * Get and remove the last N items from the data, mutating it in place.
 *
 * A count above one returns the items in reverse order. A Map is popped from the end of its insertion order.
 *
 * @param data - The data to pop from. Mutated in place for an array or record backing; a Map, Set
 * or generator backing is copied first, so the write lands on the copy and is discarded.
 * @param count - The number of items to pop
 * @returns The popped item(s), or null if the source had nothing to pop.
 *
 * @example
 *
 * dataPop([1, 2, 3]); -> 3
 * dataPop(new Map([[2, 'c'], [0, 'a'], [1, 'b']]), 2); -> ['b', 'a'], the Map left as it was
 */
export const dataPop = dispatch(
    arrPop,
    objPop,
    toPositionalBacking,
    copyKeyedData,
);

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
export const dataIntersect = dispatch(
    arrIntersect,
    objIntersect,
    toPositionalBacking,
    toKeyedData,
);

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
    toPositionalBacking,
    toKeyedData,
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
    toPositionalBacking,
    toKeyedData,
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
    toPositionalBacking,
    toKeyedData,
);
