import {
    values as objValues,
    keys as objKeys,
    filter as objFilter,
    map as objMap,
    first as objFirst,
    last as objLast,
    contains as objContains,
    diff as objDiff,
    pluck as objPluck,
    add as objAdd,
    objectItem,
    boolean as objBoolean,
    collapse as objCollapse,
    crossJoin as objCrossJoin,
    divide as objDivide,
    dot as objDot,
    undot as objUndot,
    except as objExcept,
    exists as objExists,
    take as objTake,
    flatten as objFlatten,
    flip as objFlip,
    float as objFloat,
    forget as objForget,
    from as objFrom,
    get as objGet,
    has as objHas,
    hasAll as objHasAll,
    hasAny as objHasAny,
    every as objEvery,
    some as objSome,
    integer as objInteger,
    join as objJoin,
    keyBy as objKeyBy,
    prependKeysWith as objPrependKeysWith,
    only as objOnly,
    select as objSelect,
    mapWithKeys as objMapWithKeys,
    mapSpread as objMapSpread,
    prepend as objPrepend,
    pull as objPull,
    query as objQuery,
    random as objRandom,
    set as objSet,
    push as objPush,
    shuffle as objShuffle,
    sole as objSole,
    sort as objSort,
    sortDesc as objSortDesc,
    sortRecursive as objSortRecursive,
    sortRecursiveDesc as objSortRecursiveDesc,
    string as objString,
    toCssClasses as objToCssClasses,
    toCssStyles as objToCssStyles,
    where as objWhere,
    reject as objReject,
    partition as objPartition,
    whereNotNull as objWhereNotNull,
} from "@laravel-js/obj";
import {
    values as arrValues,
    keys as arrKeys,
    filter as arrFilter,
    map as arrMap,
    first as arrFirst,
    last as arrLast,
    contains as arrContains,
    diff as arrDiff,
    pluck as arrPluck,
    wrap as arrWrap,
    add as arrAdd,
    arrayItem,
    boolean as arrBoolean,
    collapse as arrCollapse,
    crossJoin as arrCrossJoin,
    divide as arrDivide,
    dot as arrDot,
    except as arrExcept,
    exists as arrExists,
    take as arrTake,
    flatten as arrFlatten,
    flip as arrFlip,
    float as arrFloat,
    forget as arrForget,
    from as arrFrom,
    get as arrGet,
    has as arrHas,
    hasAll as arrHasAll,
    hasAny as arrHasAny,
    every as arrEvery,
    some as arrSome,
    integer as arrInteger,
    join as arrJoin,
    keyBy as arrKeyBy,
    prependKeysWith as arrPrependKeysWith,
    only as arrOnly,
    select as arrSelect,
    mapWithKeys as arrMapWithKeys,
    mapSpread as arrMapSpread,
    prepend as arrPrepend,
    pull as arrPull,
    query as arrQuery,
    random as arrRandom,
    set as arrSet,
    push as arrPush,
    shuffle as arrShuffle,
    sole as arrSole,
    sort as arrSort,
    sortDesc as arrSortDesc,
    sortRecursive as arrSortRecursive,
    sortRecursiveDesc as arrSortRecursiveDesc,
    string as arrString,
    toCssClasses as arrToCssClasses,
    toCssStyles as arrToCssStyles,
    where as arrWhere,
    reject as arrReject,
    partition as arrPartition,
    whereNotNull as arrWhereNotNull,
} from "@laravel-js/arr";
import type {
    DataItems,
    ObjectKey,
    PathKey,
    PathKeys,
} from "@laravel-js/types";
import { isObject } from "@laravel-js/utils";

/**
 * Add an element to data.
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
export function dataAdd<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    key: PathKey,
    value: T,
): DataItems<T, K> {
    if (isObject(data)) {
        return objAdd(data as Record<K, T>, key as string, value) as DataItems<
            T,
            K
        >;
    }

    return arrAdd(arrWrap(data), key as number, value) as DataItems<T>;
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
export function dataItem<D = null>(
    data: unknown,
    key: PathKey,
    defaultValue?: D,
): unknown[] | Record<string, unknown> {
    if (isObject(data)) {
        return objectItem(
            data as Record<string, unknown>,
            key as string,
            defaultValue,
        );
    }

    return arrayItem(arrWrap(data), key as number, defaultValue);
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
export function dataBoolean<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    key: PathKey,
    defaultValue = false,
): boolean {
    if (isObject(data)) {
        return objBoolean(data as Record<K, T>, key as string, defaultValue);
    }

    return arrBoolean(arrWrap(data), key as number, defaultValue);
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
export function dataCollapse<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
): Record<string, T | Record<string, unknown>> | T[] {
    if (isObject(data)) {
        return objCollapse(data as Record<K, Record<K, T>>);
    }

    return arrCollapse(arrWrap(data));
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
    if (isObject(data)) {
        // For objects, convert to format expected by objCrossJoin
        const objData = data as Record<string, readonly unknown[]>;
        const objOthers = others.map(
            (other) => other as Record<string, readonly unknown[]>,
        );
        return objCrossJoin(objData, ...objOthers);
    }

    // For arrays
    return arrCrossJoin(
        arrWrap(data) as readonly unknown[],
        ...(others as readonly unknown[][]),
    );
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
export function dataDivide<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
): [unknown[], unknown[]] {
    if (isObject(data)) {
        return objDivide(data as Record<K, T>);
    }

    return arrDivide(arrWrap(data));
}

/**
 * Convert data to dot notation.
 *
 * @param data - The data to convert
 * @param prepend - String to prepend to keys
 * @returns Data in dot notation
 *
 * @example
 *
 * dataDot({a: {b: 1, c: 2}}); -> {'a.b': 1, 'a.c': 2}
 */
export function dataDot<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    prepend = "",
): Record<string, unknown> {
    if (isObject(data)) {
        return objDot(data as Record<K, T>, prepend);
    }

    return arrDot(arrWrap(data), prepend);
}

/**
 * Convert dot notation back to nested data.
 *
 * @param data - The dot notation data to convert
 * @returns Nested data structure
 *
 * @example
 *
 * dataUndot({'a.b': 1, 'a.c': 2}); -> {a: {b: 1, c: 2}}
 */
export function dataUndot<T, K extends ObjectKey = ObjectKey>(
    data: Record<string, unknown>,
): DataItems<T, K> {
    // Always return as object since dot notation creates nested objects
    return objUndot(data) as DataItems<T, K>;
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
export function dataExcept<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    keys: PathKeys,
): DataItems<T, K> {
    if (isObject(data)) {
        return objExcept(data as Record<K, T>, keys as string[]) as DataItems<
            T,
            K
        >;
    }

    return arrExcept(arrWrap(data), keys as number[]) as DataItems<T>;
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
export function dataExists<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    key: string | number,
): boolean {
    if (isObject(data)) {
        return objExists(data as Record<K, T>, key as string);
    }

    return arrExists(arrWrap(data), key as number);
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
export function dataTake<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    limit: number,
): DataItems<T, K> {
    if (isObject(data)) {
        return objTake(data as Record<K, T>, limit) as DataItems<T, K>;
    }

    return arrTake(arrWrap(data), limit) as DataItems<T>;
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
export function dataFlatten<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    depth: number = Infinity,
) {
    if (isObject(data)) {
        return objFlatten<T, K>(data, depth);
    }

    return arrFlatten(arrWrap(data), depth);
}

export function dataFlip<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
) {
    if (isObject(data)) {
        return objFlip(data as Record<K, T>);
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
export function dataFloat<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    key: PathKey,
    defaultValue = 0.0,
): number {
    if (isObject(data)) {
        return objFloat(data as Record<K, T>, key as string, defaultValue);
    }

    return arrFloat(arrWrap(data), key as number, defaultValue);
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
export function dataForget<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    keys: PathKeys,
): DataItems<T, K> {
    if (isObject(data)) {
        return objForget(data as Record<K, T>, keys as string[]) as DataItems<
            T,
            K
        >;
    }

    return arrForget(arrWrap(data), keys as number[]) as DataItems<T>;
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
 */
export function dataFrom(items: unknown): unknown[] | Record<string, unknown> {
    if (isObject(items)) {
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
export function dataGet<T, K extends ObjectKey = ObjectKey, D = null>(
    data: DataItems<T, K>,
    key: PathKey,
    defaultValue?: D,
): T | D | null {
    if (isObject(data)) {
        return objGet(data as Record<K, T>, key as string, defaultValue);
    }

    return arrGet(arrWrap(data), key as number, defaultValue);
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
export function dataHas<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    keys: PathKeys,
): boolean {
    if (isObject(data)) {
        return objHas(data as Record<K, T>, keys as string[]);
    }

    return arrHas(arrWrap(data), keys as number[]);
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
export function dataHasAll<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    keys: PathKeys,
): boolean {
    if (isObject(data)) {
        return objHasAll(data as Record<K, T>, keys as string[]);
    }

    return arrHasAll(arrWrap(data), keys as number[]);
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
export function dataHasAny<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    keys: PathKeys,
): boolean {
    if (isObject(data)) {
        return objHasAny(data as Record<K, T>, keys as string[]);
    }

    return arrHasAny(arrWrap(data), keys as number[]);
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
 */
export function dataEvery<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    callback: (value: T, key: string | number) => boolean,
): boolean {
    if (isObject(data)) {
        return objEvery(
            data as Record<K, T>,
            callback as (value: T, key: string) => boolean,
        );
    }

    return arrEvery(
        arrWrap(data),
        callback as (value: T, index: number) => boolean,
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
 */
export function dataSome<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    callback: (value: T, key: string | number) => boolean,
): boolean {
    if (isObject(data)) {
        return objSome(
            data as Record<K, T>,
            callback as (value: T, key: string) => boolean,
        );
    }

    return arrSome(
        arrWrap(data),
        callback as (value: T, index: number) => boolean,
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
export function dataInteger<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    key: PathKey,
    defaultValue = 0,
): number {
    if (isObject(data)) {
        return objInteger(data as Record<K, T>, key as string, defaultValue);
    }

    return arrInteger(arrWrap(data), key as number, defaultValue);
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
export function dataJoin<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    glue: string,
    finalGlue = "",
): string {
    if (isObject(data)) {
        return objJoin(data as Record<K, T>, glue, finalGlue);
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
    keyBy: string | ((item: unknown) => string | number),
): Record<string | number, unknown> {
    if (isObject(data)) {
        return objKeyBy(
            data as Record<string, unknown>,
            keyBy as
                | string
                | ((item: Record<string, unknown>) => string | number),
        );
    }

    return arrKeyBy(
        arrWrap(data) as Record<string, unknown>[],
        keyBy as string | ((item: Record<string, unknown>) => string | number),
    );
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
export function dataPrependKeysWith<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    prependWith: string,
): Record<string, T> {
    if (isObject(data)) {
        return objPrependKeysWith(data as Record<K, T>, prependWith);
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
export function dataOnly<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    keys: (string | number)[],
): DataItems<T, K> {
    if (isObject(data)) {
        return objOnly(data as Record<K, T>, keys as string[]) as DataItems<
            T,
            K
        >;
    }

    return arrOnly(arrWrap(data), keys as number[]) as DataItems<T>;
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
export function dataSelect(data: unknown, keys: string[]): unknown {
    if (isObject(data)) {
        return objSelect(data as Record<string, Record<string, unknown>>, keys);
    }

    return arrSelect(
        arrWrap(data) as unknown as Record<string, unknown>[],
        keys,
    );
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
 * dataMapWithKeys([1, 2], (value, index) => [`key_${index}`, value * 2]);
 * -> {key_0: 2, key_1: 4}
 */
export function dataMapWithKeys<T, V, K extends ObjectKey = ObjectKey>(
    data: unknown,
    callback: (value: T, key: string | number) => [K, V],
): Record<K, V> {
    if (isObject(data)) {
        return objMapWithKeys(
            data as Record<string, T>,
            callback as (value: T, key: string) => Record<K, V>,
        ) as Record<K, V>;
    }

    return arrMapWithKeys(
        arrWrap(data) as T[],
        callback as (value: T, index: number) => Record<K, V>,
    ) as Record<K, V>;
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
export function dataMapSpread<U>(
    data: unknown,
    callback: (...args: unknown[]) => U,
): unknown {
    if (isObject(data)) {
        return objMapSpread(data as Record<string, unknown>, callback);
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
export function dataPrepend<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    value: T,
    key?: string,
): DataItems<T, K> {
    if (isObject(data)) {
        return objPrepend(
            data as Record<K, T>,
            value,
            key as string,
        ) as DataItems<T, K>;
    }

    return arrPrepend(arrWrap(data), value) as DataItems<T>;
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
export function dataPull<T, K extends ObjectKey = ObjectKey, D = null>(
    data: DataItems<T, K>,
    key: PathKey,
    defaultValue?: D,
): { value: T | D | null; data: DataItems<T, K> } {
    if (isObject(data)) {
        const result = objPull(
            data as Record<string, T>,
            key as string,
            defaultValue,
        );
        return {
            value: result.value as T | D | null,
            data: result.data as DataItems<T, K>,
        };
    }

    const result = arrPull(arrWrap(data), key as number, defaultValue);
    return {
        value: result.value as T | D | null,
        data: result.data as DataItems<T>,
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
export function dataQuery<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
): string {
    if (isObject(data)) {
        return objQuery(data as Record<string, unknown>);
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
export function dataRandom<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    number = 1,
    preserveKeys = false,
): unknown {
    if (isObject(data)) {
        return objRandom(data as Record<string, T>, number, preserveKeys);
    }

    return arrRandom(arrWrap(data), number, preserveKeys);
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
export function dataSet<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    key: PathKey,
    value: T,
): DataItems<T, K> {
    if (isObject(data)) {
        return objSet(
            data as Record<string, T>,
            key as string,
            value,
        ) as DataItems<T, K>;
    }

    return arrSet(arrWrap(data), key as number, value) as DataItems<T>;
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
export function dataPush<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    key: PathKey,
    values: T[],
): DataItems<T, K> {
    if (isObject(data)) {
        return objPush(
            data as Record<string, unknown>,
            key as string,
            values,
        ) as DataItems<T, K>;
    }

    return arrPush(arrWrap(data), key as number, values) as DataItems<T>;
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
export function dataShuffle<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
): DataItems<T, K> {
    if (isObject(data)) {
        return objShuffle(data as Record<string, T>) as DataItems<T, K>;
    }

    return arrShuffle(arrWrap(data)) as DataItems<T>;
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
export function dataSole<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    callback?: (value: T, key: string | number) => boolean,
): T {
    if (isObject(data)) {
        return objSole(
            data as Record<string, T>,
            callback as (value: T, key: string) => boolean,
        );
    }

    return arrSole(
        arrWrap(data),
        callback as (value: T, index: number) => boolean,
    );
}

/**
 * Sort data using a callback.
 *
 * @param data - The data to sort
 * @param callback - The comparison callback or key to sort by
 * @returns Sorted data
 *
 * @example
 *
 * dataSort([3, 1, 4, 2]); -> [1, 2, 3, 4]
 * dataSort({c: 3, a: 1, b: 2}); -> {a: 1, b: 2, c: 3}
 */
export function dataSort<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    callback?: string | ((item: T) => unknown) | null,
): DataItems<T, K> {
    if (isObject(data)) {
        return objSort(data as Record<string, T>, callback) as DataItems<T, K>;
    }

    return arrSort(arrWrap(data), callback) as DataItems<T>;
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
export function dataSortDesc<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    callback?: string | ((item: T) => unknown) | null,
): DataItems<T, K> {
    if (isObject(data)) {
        return objSortDesc(data as Record<string, T>, callback) as DataItems<
            T,
            K
        >;
    }

    return arrSortDesc(arrWrap(data), callback) as DataItems<T>;
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
export function dataSortRecursive<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    options?: number,
    descending = false,
): DataItems<T, K> {
    if (isObject(data)) {
        return objSortRecursive(
            data as Record<string, T>,
            options,
            descending,
        ) as DataItems<T, K>;
    }

    return arrSortRecursive(arrWrap(data), options, descending) as DataItems<T>;
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
export function dataSortRecursiveDesc<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    options?: number,
): DataItems<T, K> {
    if (isObject(data)) {
        return objSortRecursiveDesc(
            data as Record<string, T>,
            options,
        ) as DataItems<T, K>;
    }

    return arrSortRecursiveDesc(arrWrap(data), options) as DataItems<T>;
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
export function dataString<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    key: PathKey,
    defaultValue = "",
): string {
    if (isObject(data)) {
        return objString(
            data as Record<string, unknown>,
            key as string,
            defaultValue,
        );
    }

    return arrString(arrWrap(data), key as number, defaultValue);
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
export function dataToCssClasses<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
): string {
    if (isObject(data)) {
        return objToCssClasses(data as Record<string, unknown>);
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
export function dataToCssStyles<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
): string {
    if (isObject(data)) {
        return objToCssStyles(data as Record<string, unknown>);
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
export function dataWhere<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    callback: (value: T, key: string | number) => boolean,
): DataItems<T, K> {
    if (isObject(data)) {
        return objWhere(
            data as Record<string, T>,
            callback as (value: T, key: string) => boolean,
        ) as DataItems<T, K>;
    }

    return arrWhere(
        arrWrap(data),
        callback as (value: T, index: number) => boolean,
    ) as DataItems<T>;
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
export function dataReject<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    callback: (value: T, key: string | number) => boolean,
): DataItems<T, K> {
    if (isObject(data)) {
        return objReject(
            data as Record<string, T>,
            callback as (value: T, key: string) => boolean,
        ) as DataItems<T, K>;
    }

    return arrReject(
        arrWrap(data),
        callback as (value: T, index: number) => boolean,
    ) as DataItems<T>;
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
export function dataPartition<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    callback: (value: T, key: string | number) => boolean,
): [DataItems<T, K>, DataItems<T, K>] {
    if (isObject(data)) {
        const [passing, failing] = objPartition(
            data as Record<string, T>,
            callback as (value: T, key: string) => boolean,
        );
        return [passing as DataItems<T, K>, failing as DataItems<T, K>];
    }

    const [passing, failing] = arrPartition(
        arrWrap(data),
        callback as (value: T, index: number) => boolean,
    );
    return [passing as DataItems<T>, failing as DataItems<T>];
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
export function dataWhereNotNull<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T | null, K>,
): DataItems<T, K> {
    if (isObject(data)) {
        return objWhereNotNull(data as Record<string, T | null>) as DataItems<
            T,
            K
        >;
    }

    return arrWhereNotNull(arrWrap(data)) as DataItems<T>;
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
export function dataValues<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
): T[] {
    if (isObject(data)) {
        return objValues(data as Record<K, T>) as T[];
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
export function dataKeys<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
): (string | number)[] {
    if (isObject(data)) {
        return objKeys(data as Record<K, T>);
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
export function dataFilter<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    callback?: ((value: T, key: K) => boolean) | null,
): DataItems<T, K> {
    if (isObject(data)) {
        return objFilter(
            data as Record<string, T>,
            callback as (value: T, key: string) => boolean,
        ) as DataItems<T, K>;
    }

    return arrFilter(
        arrWrap(data),
        callback as (value: T, index: number) => boolean,
    ) as DataItems<T>;
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
 * Data.map([1, 2, 3], (value) => value * 2); -> [2, 4, 6]
 * Data.map({a: 1, b: 2}, (value) => value * 2); -> {a: 2, b: 4}
 */
export function dataMap<T, U, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    callback: (value: T, key: string | number) => U,
): DataItems<U, K> {
    if (isObject(data)) {
        return objMap(
            data as Record<string, T>,
            callback as (value: T, key: string) => U,
        ) as DataItems<U, K>;
    }

    return arrMap(
        arrWrap(data),
        callback as (value: T, index: number) => U,
    ) as DataItems<U>;
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
 * Data.first([1, 2, 3, 4], (value) => value > 2); -> 3
 * Data.first({a: 1, b: 2, c: 3}, (value) => value > 1); -> 2
 */
export function dataFirst<TValue, TKey extends ObjectKey = ObjectKey, TFirstDefault = null>(
    data: DataItems<TValue, TKey>,
    callback?: ((value: TValue, key: TKey) => boolean) | null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null {
    if (isObject(data)) {
        const result = objFirst(
            data,
            callback,
            defaultValue,
        );

        return result === undefined ? null : result;
    }

    const result = arrFirst(
        data,
        callback as (value: TValue, index: number) => boolean,
        defaultValue,
    ); 

    return result === undefined ? null : result;
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
 */
export function dataLast<T, K extends ObjectKey = ObjectKey, D = null>(
    data: DataItems<T, K>,
    callback?: ((value: T, key: string | number) => boolean) | null,
    defaultValue?: D | (() => D),
): T | D | null {
    if (isObject(data)) {
        if (callback) {
            const result = objLast(
                data,
                callback as (value: T, key: string) => boolean,
                defaultValue,
            );
            return result === undefined ? null : result;
        } else {
            const result = objLast(data, undefined, defaultValue);
            return result === undefined ? null : result;
        }
    }

    if (callback) {
        const result = arrLast(
            data,
            callback as (value: T, index: number) => boolean,
            defaultValue,
        );
        return result === undefined ? null : result;
    } else {
        const result = arrLast(data, undefined, defaultValue);
        return result === undefined ? null : result;
    }
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
export function dataContains<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    value: T | ((value: T, key: string | number) => boolean),
    strict = false,
): boolean {
    if (isObject(data)) {
        return objContains(
            data as Record<string, T>,
            value as
                | Record<string, unknown>
                | ((
                      value: Record<string, unknown>,
                      key: string | number,
                  ) => boolean),
            strict,
        );
    }

    return arrContains(arrWrap(data), value, strict);
}

/**
 * Get the differences between data collections.
 *
 * @param data - The source data
 * @param other - The data to compare against
 * @returns Data with differences, preserving structure
 *
 * @example
 *
 * Data.diff([1, 2, 3, 4], [2, 4]); -> [1, 3]
 * Data.diff({a: 1, b: 2, c: 3}, {b: 2, d: 4}); -> {a: 1, c: 3}
 */
export function dataDiff<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    other: DataItems<T, K>,
): DataItems<T, K> {
    if (isObject(data) && isObject(other)) {
        return objDiff(
            data as Record<string, T>,
            other as Record<string, T>,
        ) as DataItems<T, K>;
    }

    return arrDiff(arrWrap(data), arrWrap(other)) as DataItems<T>;
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
export function dataPluck<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    value: string | ((item: T) => T),
    key: string | ((item: T) => string | number) | null = null,
): DataItems<T, K> {
    if (isObject(data)) {
        return objPluck(
            data as Record<K, T>,
            value as string | ((item: Record<K, T>) => unknown),
            key as string | ((item: Record<K, T>) => string | number) | null,
        ) as DataItems<T, K>;
    }

    return arrPluck(
        arrWrap(data) as unknown as Record<K, T>[],
        value as string | ((item: Record<K, T>) => T),
        key as string | ((item: Record<K, T>) => string | number) | null,
    ) as DataItems<T>;
}
