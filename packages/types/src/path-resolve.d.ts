/**
 * A key used to access a path in an object or array.
 */
export type PathKey = number | string | null | undefined;

/**
 * A set of keys used to access a path in an object or array.
 *
 * The array half is `readonly`, so a caller may hand over an `as const` tuple: nothing
 * reading a key set writes to it.
 */
export type PathKeys = number | string | null | undefined | readonly PathKey[];

/**
 * Unwraps a value or function that returns a value.
 */
export type UnwrapFn<T> = T extends (...args: unknown[]) => infer R ? R : T;

/**
 * Path resolution types for resolving values at dot-delimited paths
 * in arrays and objects. Inspired by Lodash's GetFieldType but tailored
 * for array-first contexts (like Laravel's Arr helpers).
 */

/**
 * Resolves the type of a value at a single key in a type.
 *
 * For arrays: numeric keys resolve to the element type.
 * For objects: string keys resolve to the property type.
 * For tuples: specific numeric keys resolve to the element at that position.
 * For Maps: any key resolves to the value type or `undefined`, since a Map may not hold it.
 *
 * @example
 * ```ts
 * type A = ResolveKey<string[], 0>; // string
 * type B = ResolveKey<{ name: string; age: number }, "name">; // string
 * type C = ResolveKey<[string, number], 1>; // number
 * type D = ResolveKey<Map<string, number>, "size">; // number | undefined
 * ```
 */
export type ResolveKey<T, K> = [T] extends [
    Exclude<T, ReadonlyMap<unknown, unknown>>,
]
    ? ResolveOwnKey<T, K>
    : // A Map stands for a PHP array, so its entries are its keys and `size` or a method never is.
      T extends ReadonlyMap<unknown, infer V>
      ? V | undefined
      : ResolveOwnKey<T, K>;

/** {@link ResolveKey} for a value that is not a Map: a property, a list element or a tuple member. */
type ResolveOwnKey<T, K> =
    // If K is directly a key of T (handles objects and tuple numeric indices)
    K extends keyof T
        ? T[K]
        : // If K is a number and T is an array, resolve element type
          T extends readonly (infer U)[]
          ? K extends number
              ? U
              : // If K is a numeric string like "0", resolve element type
                K extends `${number}`
                ? U
                : undefined
          : // If K is a numeric string and T is an object with that as key
            K extends `${infer N extends number}`
            ? N extends keyof T
                ? T[N]
                : undefined
            : // If K is a number and the stringified version is a key
              K extends number
              ? `${K}` extends keyof T
                  ? T[`${K}`]
                  : undefined
              : undefined;

/**
 * Resolves the type at a dot-delimited path within a type.
 * Recursively walks through the path segments.
 *
 * @example
 * ```ts
 * type A = ResolvePath<{ user: { name: string } }, "user.name">; // string
 * type B = ResolvePath<{ items: number[] }, "items.0">; // number
 * type C = ResolvePath<[{ name: string }], "0.name">; // string
 * ```
 */
export type ResolvePath<T, P> =
    // If P is a string with dots, split and recurse
    P extends `${infer First}.${infer Rest}`
        ? ResolveKey<T, First> extends infer Resolved
            ? Resolved extends undefined
                ? undefined
                : ResolvePath<NonNullable<Resolved>, Rest>
            : undefined
        : // No dots: just resolve a single key
          ResolveKey<T, P>;

/**
 * Resolves the type at a path within an array context.
 * This is the main type for Arr helper functions that operate on arrays
 * and use dot-notation paths to access nested values.
 *
 * When the path is a non-literal `string` or `number`, falls back to TDefault
 * since the path cannot be statically resolved.
 *
 * When the path is `null` or `undefined`, returns the entire array.
 *
 * @template TArray - The array type to resolve from (e.g., `string[]`, `{name: string}[]`)
 * @template TPath - The path to resolve (e.g., `0`, `"0.name"`, `"0.items.1"`)
 * @template TDefault - The fallback type when the path cannot be resolved (defaults to `unknown`)
 *
 * @example
 * ```ts
 * type A = ArrayResolvePath<string[], 0>; // string
 * type B = ArrayResolvePath<{name: string}[], "0.name">; // string
 * type C = ArrayResolvePath<{users: {name: string}[]}[], "0.users.0.name">; // string
 * type D = ArrayResolvePath<string[], null>; // string[]
 * type E = ArrayResolvePath<string[], string>; // unknown (non-literal)
 * ```
 */
export type ArrayResolvePath<
    TArray extends readonly unknown[],
    TPath,
    TDefault = unknown,
> =
    // null/undefined key → return the entire array
    TPath extends null | undefined
        ? TArray
        : // Literal number → resolve element type
          number extends TPath
          ? TDefault
          : // Literal string check — non-literal strings should fallback
            TPath extends string
            ? string extends TPath
                ? TDefault
                : ResolvePath<TArray, TPath> extends infer R
                  ? [R] extends [undefined]
                      ? TDefault
                      : R
                  : TDefault
            : TPath extends number
              ? ResolvePath<TArray, `${TPath}`> extends infer R
                  ? [R] extends [undefined]
                      ? TDefault
                      : R
                  : TDefault
              : TDefault;

/**
 * Ensures a resolved path type is an array type.
 * If the resolved type is already an array, returns it as-is.
 * Otherwise falls back to `unknown[]`.
 *
 * Handles the `never` case (e.g., from empty arrays) by falling back
 * to `unknown[]` instead of propagating `never`.
 *
 * Useful for functions like `arrayItem` that validate the resolved
 * value is an array at runtime and throw if not.
 *
 * @example
 * ```ts
 * type A = EnsureArray<string[]>; // string[]
 * type B = EnsureArray<number>; // unknown[]
 * type C = EnsureArray<unknown>; // unknown[]
 * type D = EnsureArray<never>; // unknown[]
 * ```
 */
export type EnsureArray<T> = [T] extends [never]
    ? unknown[]
    : T extends readonly unknown[]
      ? T
      : unknown[];

/**
 * Checks whether a type is a literal string or number, rather than a
 * widened `string` or `number` type.
 *
 * @example
 * ```ts
 * type A = IsLiteral<"hello">; // true
 * type B = IsLiteral<42>; // true
 * type C = IsLiteral<string>; // false
 * type D = IsLiteral<number>; // false
 * ```
 */
export type IsLiteral<T> = string extends T
    ? false
    : number extends T
      ? false
      : T extends string | number
        ? true
        : false;

/**
 * Resolves a path within an array and adds `| null` only when the path
 * is non-literal (widened `string` or `number`), meaning it cannot be
 * statically verified at compile time.
 *
 * When the path is a literal (e.g., `0`, `"0.name"`), returns just the
 * resolved type without `| null`, consistent with TypeScript's array
 * access convention where `arr[0]` returns the element type without
 * `| undefined`.
 *
 * When the path is non-literal (`string` or `number`), `| null` is added
 * since the path cannot be verified at compile time.
 *
 * @example
 * ```ts
 * Literal path → resolved type, no null
 * type A = ArrayResolvePathOrNull<{name: string}[], "0.name">; // string
 *
 * Non-literal path → element type | null
 * type B = ArrayResolvePathOrNull<{name: string}[], string>; // {name: string} | null
 *
 * Literal index on simple array → element type, no null
 * type C = ArrayResolvePathOrNull<string[], 0>; // string
 * ```
 */
export type ArrayResolvePathOrNull<TArray extends readonly unknown[], TPath> =
    IsLiteral<TPath> extends true
        ? PathFallback<ArrayResolvePath<TArray, TPath, TArray[number]>, null>
        : ArrayResolvePath<TArray, TPath, TArray[number]> | null;

/**
 * Swaps the `undefined` an optional intermediate segment leaves behind for the value
 * the helper actually answers with.
 *
 * `{ a?: { b: string } }` resolved at `"a.b"` is `string | undefined`, because the
 * optional `a` distributes through the walk. `Arr.get` never returns `undefined` for
 * that path — it returns its default, `null` when none was given — so the resolved
 * type must say so. A fully unresolved path is already `never` here and takes the
 * fallback whole.
 *
 * @example
 * ```ts
 * type A = PathFallback<string | undefined, null>; // string | null
 * type B = PathFallback<string, "D">; // string
 * type C = PathFallback<never, "D">; // "D"
 * ```
 */
type PathFallback<TResolved, TFallback> = [TResolved] extends [never]
    ? TFallback
    : TResolved extends undefined
      ? TFallback
      : TResolved;

/**
 * Resolves a path within an array and adds `| TDefault` only when the path
 * is non-literal (widened `string` or `number`), meaning it cannot be
 * statically verified at compile time.
 *
 * When the path is a literal (e.g., `0`, `"0.name"`), returns just the
 * resolved type without `| TDefault`, since the path is trusted at compile
 * time — consistent with {@link ArrayResolvePathOrNull}.
 *
 * When the path is non-literal, `| TDefault` is added since the path
 * cannot be verified and the default value may be returned at runtime.
 *
 * @example
 * ```ts
 * // Literal path → resolved type, no default in union
 * type A = ArrayResolvePathOrDefault<string[], 1, number>; // string
 *
 * // Non-literal path → element type | default
 * type B = ArrayResolvePathOrDefault<string[], number, number>; // string | number
 * ```
 */
export type ArrayResolvePathOrDefault<
    TArray extends readonly unknown[],
    TPath,
    TDefault,
> =
    IsLiteral<TPath> extends true
        ? PathFallback<ArrayResolvePath<TArray, TPath, TDefault>, TDefault>
        : ArrayResolvePath<TArray, TPath, TArray[number]> | TDefault;

/**
 * Gets the type of a value at a given path in an object or array.
 * Supports dot notation (a.b.c) and array indexing (a.0.b).
 *
 * Delegates to {@link ResolvePath} for the actual path resolution
 * logic and adds TDefault fallback handling.
 */
export type GetFieldType<
    T,
    P extends string | number,
    TDefault = never,
> = P extends keyof T
    ? T[P]
    : P extends string
      ? ResolvePath<T, P> extends infer R
          ? [R] extends [undefined]
              ? TDefault
              : R
          : TDefault
      : P extends number
        ? ResolveKey<T, P> extends infer R
            ? [R] extends [undefined]
                ? TDefault
                : R
            : TDefault
        : TDefault;

/**
 * Resolves the value type produced by plucking `TPath` out of each element of
 * an array. A `*` segment produces an array of the values found at that level.
 * Non-literal paths resolve to `unknown`.
 *
 * The terminal (non-wildcard) arm maps `undefined` to `null`: at runtime,
 * `resolvePluckPath` (arr.ts) substitutes `null` for any segment that
 * resolves to `undefined` — including an absent optional property — so an
 * optional property's type must be `T | null`, never `T | undefined`, to
 * match what `pluck` actually returns.
 *
 * The same mapping applies to intermediate segments: an optional or
 * nullable intermediate makes the whole resolved type nullable, because
 * `resolvePluckPath` short-circuits to `null` the moment any segment is
 * null or undefined.
 *
 * @example
 * PluckValue<{ name: string }, "name">                    // string
 * PluckValue<{ user: { name: string } }, "user.name">     // string
 * PluckValue<{ users: { first: string }[] }, "users.*.first"> // string[]
 * PluckValue<{ name: string }, string>                    // unknown
 * PluckValue<{ name?: string }, "name">                   // string | null
 * PluckValue<{ user?: { name: string } }, "user.name">    // string | null
 */
export type PluckValue<TItem, TPath> =
    TPath extends `${infer Head}.${infer Rest}`
        ? Head extends "*"
            ? TItem extends readonly (infer TElement)[]
                ? PluckValue<TElement, Rest>[]
                : unknown
            : Head extends keyof TItem
              ? null extends TItem[Head]
                  ? PluckValue<NonNullable<TItem[Head]>, Rest> | null
                  : undefined extends TItem[Head]
                    ? PluckValue<NonNullable<TItem[Head]>, Rest> | null
                    : PluckValue<TItem[Head], Rest>
              : unknown
        : TPath extends "*"
          ? TItem extends readonly (infer TElement)[]
              ? TElement[]
              : unknown
          : TPath extends keyof TItem
            ? TItem[TPath] extends infer TResolved
                ? TResolved extends undefined
                    ? null
                    : TResolved
                : never
            : unknown;

type ObjectPathDepth = [never, 0, 1, 2, 3, 4];

/** `T`'s declared keys, without its string, number or symbol index signatures. */
type KnownObjectKeys<T> = keyof {
    [K in keyof T as string extends K
        ? never
        : number extends K
          ? never
          : symbol extends K
            ? never
            : K]: unknown;
};

/**
 * Whether `T` is the bare `object` type: it names no key, yet any object's entries may sit behind it. `{}`, which a
 * string also fits, is the type of an empty object literal, so it stays keyless.
 */
type IsBareObject<T> = [keyof T] extends [never]
    ? string extends T
        ? false
        : T extends (...args: never[]) => unknown
          ? false
          : true
    : false;

/** One step through an index signature: always possibly missing. A numeric segment also reads a number index. */
type ObjectIndexStep<T, K extends string> = K extends keyof T
    ? [T[K & keyof T], true]
    : K extends `${infer N extends number}`
      ? N extends keyof T
          ? [T[N & keyof T], true]
          : [never, true]
      : [never, true];

/**
 * Resolves one path segment to `[value, mayBeMissing]`. `get()` walks objects, lists and Maps, so a scalar or function
 * ends the path; a built-in object's members are mostly on its prototype, which `Object.hasOwn` doesn't see.
 */
type ObjectPathStep<T, K extends string> = T extends readonly unknown[]
    ? K extends `${number}`
        ? // A tuple declares its indices as string keys, so the segment matches one and its number never does.
          K extends KnownObjectKeys<T>
            ? [T[K & keyof T], false]
            : [T[number], true]
        : [never, true]
    : T extends ReadonlyMap<unknown, infer V>
      ? [V, true]
      : T extends
              | string
              | number
              | boolean
              | bigint
              | symbol
              | ((...args: never[]) => unknown)
        ? [never, true]
        : T extends
                | Date
                | RegExp
                | Promise<unknown>
                | ReadonlySet<unknown>
                | WeakMap<object, unknown>
                | WeakSet<object>
          ? [T[K & keyof T], true]
          : IsBareObject<T> extends true
            ? [unknown, true]
            : ObjectKeyStep<T, K>;

/** One segment through an object with declared keys or index signatures. */
type ObjectKeyStep<T, K extends string> =
    K extends KnownObjectKeys<T>
        ? [T[K], false]
        : K extends `${infer N extends number}`
          ? N extends KnownObjectKeys<T>
              ? [T[N & keyof T], false]
              : ObjectIndexStep<T, K>
          : ObjectIndexStep<T, K>;

type ObjectSegmentMissing<V, M> = M extends true
    ? true
    : null extends V
      ? true
      : undefined extends V
        ? true
        : false;

/** Walks a dot path to `[resolvedValue, mayBeMissing]`. */
type ObjectPathWalk<
    T,
    P extends string,
> = P extends `${infer Head}.${infer Rest}`
    ? ObjectPathStep<T, Head> extends [infer V, infer M]
        ? unknown extends V
            ? [unknown, true]
            : [NonNullable<V>] extends [never]
              ? [never, true]
              : ObjectPathWalk<NonNullable<V>, Rest> extends [
                      infer RV,
                      infer RM,
                  ]
                ? [RV, ObjectSegmentMissing<V, M> | RM]
                : never
        : never
    : ObjectPathLeaf<T, P>;

/** A path's last segment: `[value, mayBeMissing]`, where an `undefined` value counts as missing. */
type ObjectPathLeaf<T, K extends string> =
    ObjectPathStep<T, K> extends [infer V, infer M]
        ? [
              Exclude<V, undefined>,
              M extends true ? true : undefined extends V ? true : false,
          ]
        : never;

/**
 * A path from the top, the way `get()` reads it, for each member of `T`: a number key is one literal key and never
 * walks, and a dotted path is read as one literal key first whenever `T` may hold it.
 */
type ObjectPathTop<T, P> = T extends unknown
    ? P extends number
        ? ObjectPathLeaf<T, `${P}`>
        : P extends `${string}.${string}`
          ? ObjectPathLiteral<T, P> extends true
              ? ObjectPathLeaf<T, P>
              : ObjectPathLiteral<T, P> extends false
                ? ObjectPathWalk<T, P>
                : ObjectPathLeaf<T, P> | ObjectPathWalk<T, P>
          : P extends string
            ? ObjectPathWalk<T, P>
            : never
    : never;

/** Whether `get()` reads dotted path `P` as one literal key of `T`: always, never, or maybe (then it walks). */
type ObjectPathLiteral<T, P extends string> =
    // get() tries a dotted key on a Map before walking it, and a Map's type never promises which keys it holds.
    T extends ReadonlyMap<unknown, unknown>
        ? boolean
        : P extends KnownObjectKeys<T>
          ? Record<never, never> extends Pick<T, P & keyof T>
              ? boolean
              : true
          : string extends keyof T
            ? boolean
            : P extends `${number}`
              ? number extends keyof T
                  ? boolean
                  : false
              : false;

/**
 * Every value a dot path through `T` can reach, to a bounded depth. Used when
 * a path is a widened `string`, so it may address any node; past the depth
 * bound it widens to `unknown`.
 *
 * @example
 * ObjectPathValue<{ a: { b: number } }> // { b: number } | number
 */
export type ObjectPathValue<T, D extends number = 5> = [D] extends [never]
    ? unknown
    : T extends readonly (infer E)[]
      ?
            | Exclude<E, undefined>
            | ObjectPathValue<NonNullable<E>, ObjectPathDepth[D]>
      : T extends ReadonlyMap<unknown, infer V>
        ?
              | Exclude<V, undefined>
              | ObjectPathValue<NonNullable<V>, ObjectPathDepth[D]>
        : T extends (...args: never[]) => unknown
          ? never
          : T extends object
            ? [keyof T] extends [never]
                ? unknown
                : {
                      [K in keyof T]-?:
                          | Exclude<T[K], undefined>
                          | ObjectPathValue<
                                NonNullable<T[K]>,
                                ObjectPathDepth[D]
                            >;
                  }[keyof T]
            : never;

/**
 * Resolves the value at a dot path within an object, adding `TDefault`
 * exactly when the path may not exist: an optional or nullable segment, an
 * index-signature key, an array index, or a key the type does not declare.
 * A `null` leaf is returned as `null`, not the default, like `Arr::get`.
 *
 * Unlike {@link ArrayResolvePath}, a literal path is only trusted through
 * declared keys: arrays have no declared indices, objects usually do. As in
 * `get()`, a top-level key is read literally first, and a number key never walks.
 *
 * @example
 * ObjectResolvePath<{ a: { b: number } }, "a.b">          // number
 * ObjectResolvePath<{ a?: { b: number } }, "a.b">         // number | null
 * ObjectResolvePath<Record<string, number>, "x", 0>       // number | 0
 * ObjectResolvePath<{ a: number }, null>                  // { a: number }
 * ObjectResolvePath<{ a: { b: number } }, string>         // { b: number } | number | null
 */
export type ObjectResolvePath<T, P, TDefault = null> = P extends
    | null
    | undefined
    ? T
    : Record<never, never> extends Record<P & (string | number), unknown>
      ? ObjectPathValue<T> | TDefault
      : ObjectPathTop<T, P> extends [infer V, infer M]
        ? V | (true extends M ? TDefault : never)
        : TDefault;

/** A depth `ObjectDotPath` can count down from; a larger one would index past `ObjectDotPathDepth` and lift the cap. */
type ObjectDotPathMaxDepth = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** The depth left one segment further down. */
type ObjectDotPathDepth = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Whether a member of `T` can be a function, as on a DOM node, a class instance with methods or a Collection. */
// An `any` member is not a method, so a loosely typed group still lists its keys.
type ObjectHasMethod<T> = true extends {
    [TKey in keyof T]-?: 0 extends 1 & T[TKey]
        ? false
        : [Extract<T[TKey], (...args: never[]) => unknown>] extends [never]
          ? false
          : true;
}[keyof T]
    ? true
    : false;

/** The paths below a member: an object with a method is listed but never walked into. */
// Distributed, so `HTMLElement | null` ends too; a list's own methods do not count.
type ObjectDotPathBelow<
    T,
    TValue,
    TDepth extends ObjectDotPathMaxDepth,
> = T extends readonly unknown[]
    ? ObjectDotPath<T, TValue, TDepth>
    : ObjectHasMethod<T> extends true
      ? never
      : ObjectDotPath<T, TValue, TDepth>;

/** A path, when the value under it can be a `TValue`. */
type ObjectDotPathTo<TPath extends string, TChild, TValue> = [
    Extract<TChild, TValue>,
] extends [never]
    ? never
    : TPath;

/**
 * Every dot path into `T`, at most `TDepth` segments deep (0 to 10), whose value can be a `TValue`. An object's paths
 * go by its string and number keys and a list's by index. A member holding a scalar, a function, an object with a
 * method such as a DOM node, or a `Map`, `Set`, `WeakMap`, `WeakSet`, `Date`, `RegExp` or `Promise` ends the path.
 *
 * @example
 * ObjectDotPath<{ a: { b: string }; c: string }>         // "a" | "a.b" | "c"
 * ObjectDotPath<{ l: { x: string }[] }>                  // "l" | `l.${number}` | `l.${number}.x`
 * ObjectDotPath<{ a: { b: string }; c: string }, object> // "a"
 */
export type ObjectDotPath<
    T,
    TValue = unknown,
    TDepth extends ObjectDotPathMaxDepth = 5,
> = TDepth extends 0
    ? never
    : T extends
            | string
            | number
            | boolean
            | bigint
            | symbol
            | ((...args: never[]) => unknown)
            | ReadonlyMap<unknown, unknown>
            | ReadonlySet<unknown>
            | WeakMap<object, unknown>
            | WeakSet<object>
            | Date
            | RegExp
            | Promise<unknown>
      ? never
      : T extends readonly (infer TItem)[]
        ?
              | ObjectDotPathTo<`${number}`, TItem, TValue>
              | `${number}.${ObjectDotPathBelow<TItem, TValue, ObjectDotPathDepth[TDepth]>}`
        : T extends object
          ? {
                [TKey in keyof T & (string | number)]:
                    | ObjectDotPathTo<`${TKey}`, T[TKey], TValue>
                    | `${TKey}.${ObjectDotPathBelow<T[TKey], TValue, ObjectDotPathDepth[TDepth]>}`;
            }[keyof T & (string | number)]
          : never;

/** One segment of a path `ObjectDotPath` lists: a pattern reads any member of a list, or an index signature's value. */
type ObjectDotPathStep<T, K extends string> =
    Record<never, never> extends Record<K, unknown>
        ? T extends readonly unknown[]
            ? T[number]
            : T extends object
              ? K extends `${number}`
                  ? number extends keyof T
                      ? T[number & keyof T]
                      : never
                  : string extends keyof T
                    ? T[string & keyof T]
                    : never
              : never
        : ObjectPathStep<T, K>[0];

/** Walks a path `ObjectDotPath` lists, one segment at a time. */
type ObjectDotPathWalk<
    T,
    P extends string,
> = P extends `${infer Head}.${infer Rest}`
    ? ObjectDotPathStep<T, Head> extends infer V
        ? unknown extends V
            ? unknown
            : ObjectDotPathWalk<NonNullable<V>, Rest>
        : never
    : ObjectDotPathStep<T, P>;

/**
 * The value at a path {@link ObjectDotPath} lists, where `${number}` is any one list index and `${string}` any one key.
 * As with `Arr::get()` and `data_get()`, a dotted key is read whole only at the top level, so `"g.a.b"`, which
 * `ObjectDotPath` lists for `{ g: { "a.b": number } }`, reaches nothing.
 *
 * @example
 * ObjectDotPathValue<{ l: { x: string }[] }, `l.${number}`> // { x: string }
 */
export type ObjectDotPathValue<T, P extends string> = P extends string
    ? Record<never, never> extends Record<P, unknown>
        ? Exclude<ObjectDotPathWalk<T, P>, undefined>
        : ObjectResolvePath<T, P, never>
    : never;
