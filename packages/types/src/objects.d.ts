import type { ArrayInnerValue } from "./arrays";
import type { KnownObjectKeys } from "./path-resolve";

/**
 * Helper type to add a key-value pair to an object type
 */
export type AddToObject<
    T extends Record<PropertyKey, unknown>,
    K extends PropertyKey,
    V,
> = T & Record<K, V>;

/**
 * Values the `@tolki/obj` helpers never walk as objects: arrays, Maps, Sets,
 * WeakMaps, WeakSets and functions. An overload taking this type first routes
 * them to the untyped result instead of a misleading per-key type.
 */
export type NonObjectItems =
    | readonly unknown[]
    | ReadonlyMap<unknown, unknown>
    | ReadonlySet<unknown>
    | WeakMap<object, unknown>
    | WeakSet<object>
    | ((...args: never[]) => unknown);

/**
 * Flattens an intersection into a single object type, so hovers and exact
 * type assertions see plain properties.
 *
 * @example
 * Simplify<{ a: 1 } & { b: 2 }> // { a: 1; b: 2 }
 */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Converts a union to an intersection.
 *
 * @example
 * UnionToIntersection<{ a: 1 } | { b: 2 }> // { a: 1 } & { b: 2 }
 */
export type UnionToIntersection<U> = (
    U extends unknown ? (value: U) => void : never
) extends (value: infer I) => void
    ? I
    : never;

/**
 * The union of an object's value types.
 *
 * @example
 * ObjectValue<{ a: number; b: string }> // number | string
 */
export type ObjectValue<T> = T[keyof T];

/**
 * The key PHP stores for an array key: a canonical decimal integer string
 * becomes a number, every other string stays a string.
 *
 * @example
 * PhpArrayKey<"10">  // 10
 * PhpArrayKey<"-1">  // -1
 * PhpArrayKey<"01">  // "01"
 * PhpArrayKey<"1.5"> // "1.5"
 */
export type PhpArrayKey<K> = K extends number
    ? K
    : K extends `${infer N extends number}`
      ? K extends `${bigint}`
          ? `${N}` extends K
              ? N
              : K
          : K
      : K extends string
        ? string extends K
            ? string | number
            : K
        : never;

/**
 * The keys `@tolki/obj` reports for an object's own keys, the way PHP would:
 * what `keys()` returns and what every callback receives as its key.
 *
 * @example
 * ObjectKey<{ a: 1; 0: 2; "10": 3 }> // "a" | 0 | 10
 */
export type ObjectKey<T> = PhpArrayKey<keyof T>;

/**
 * The object an obj helper returns after renumbering integer-like keys: `T`
 * itself when it has none, otherwise a record of its values.
 *
 * @example
 * ReindexedObject<{ a: 1 }>       // { a: 1 }
 * ReindexedObject<{ 0: "x" }>     // Record<string | number, "x">
 */
export type ReindexedObject<T> = [
    Extract<keyof T, number | `${number}`>,
] extends [never]
    ? T
    : Record<string | number, ObjectValue<T>>;

type PhpFalsyValue = null | undefined | false | 0 | "";

/**
 * The entries left after dropping PHP-falsy values: every key becomes
 * optional, and a key whose type is only ever falsy is removed.
 *
 * @example
 * TruthyObject<{ a: number; b: null; c: string }> // { a?: number; c?: string }
 */
export type TruthyObject<T> = {
    -readonly [K in keyof T as [Exclude<T[K], PhpFalsyValue>] extends [never]
        ? never
        : K]?: Exclude<T[K], PhpFalsyValue>;
};

/**
 * The entries left after dropping `null` values: a key that may be `null`
 * becomes optional, a key that is only `null` is removed.
 *
 * @example
 * NonNullableObject<{ a: string | null; b: null; c: number }> // { a?: string; c: number }
 */
export type NonNullableObject<T> = Simplify<
    {
        -readonly [K in keyof T as null extends T[K]
            ? [Exclude<T[K], null>] extends [never]
                ? never
                : K
            : never]?: Exclude<T[K], null>;
    } & {
        -readonly [K in keyof T as null extends T[K] ? never : K]: T[K];
    }
>;

/**
 * Swaps an object's keys and values, skipping values PHP could not use as a key.
 *
 * @example
 * FlipObject<{ name: "taylor" }> // { taylor: "name" }
 */
export type FlipObject<T> = {
    -readonly [K in keyof T as T[K] extends string | number
        ? `${T[K]}`
        : never]: PhpArrayKey<K>;
};

/**
 * Prefixes every string or numeric key of an object.
 *
 * @example
 * PrefixKeys<{ a: 1 }, "item_"> // { item_a: 1 }
 */
export type PrefixKeys<T, P extends string> = {
    -readonly [K in keyof T as K extends string | number
        ? `${P}${K}`
        : never]: T[K];
};

type PlainObjectOf<T> = T extends NonObjectItems | null | undefined
    ? never
    : T extends object
      ? T
      : never;

/**
 * The entries `arrayableItems()` reads from an operand: an Enumerable- or
 * Arrayable-like object unwraps through `all()`, `toArray()` or `toJSON()`,
 * a list or iterable is keyed by index, a Map by its keys, `null` and
 * `undefined` are empty, and a scalar or function sits under key 0.
 *
 * @example
 * ArrayableItems<{ all(): { a: number } }> // { a: number }
 * ArrayableItems<string[]>                  // Record<number, string>
 * ArrayableItems<null>                      // Record<never, never>
 */
export type ArrayableItems<T> = unknown extends T
    ? Record<string, unknown>
    : T extends null | undefined
      ? Record<never, never>
      : T extends readonly unknown[]
        ? Record<number, T[number]>
        : T extends (...args: never[]) => unknown
          ? { 0: T }
          : T extends object
            ? T extends { all: (...args: never[]) => infer R }
                ? ArrayableItems<R>
                : T extends { toArray: (...args: never[]) => infer R }
                  ? ArrayableItems<R>
                  : T extends { toJSON: (...args: never[]) => infer R }
                    ? ArrayableItems<R>
                    : T extends ReadonlyMap<infer K, infer V>
                      ? MapItems<K extends string | number ? K : string, V>
                      : T extends WeakMap<object, unknown> | WeakSet<object>
                        ? Record<never, never>
                        : T extends Iterable<infer V>
                          ? Record<number, V>
                          : T
            : { 0: T };

/** A Map's entries as an object: `String(key)` holds each value, and a literal key may be absent. */
type MapItems<K extends string | number, V> = string extends K
    ? Record<string, V>
    : number extends K
      ? Record<number, V>
      : Partial<Record<K, V>>;

/**
 * The own entries `{ ...value }` copies: a list's indices, and nothing from a Map, Set, Date, RegExp, Promise or
 * function, none of which keeps its data in own enumerable keys.
 */
export type SpreadItems<T> = T extends readonly unknown[]
    ? Record<number, T[number]>
    : T extends
            | ReadonlyMap<unknown, unknown>
            | ReadonlySet<unknown>
            | WeakMap<object, unknown>
            | WeakSet<object>
            | Date
            | RegExp
            | Promise<unknown>
            | ((...args: never[]) => unknown)
      ? Record<never, never>
      : T;

/** The keys `T` always has: declared, and not optional. */
type RequiredObjectKeys<T> = {
    [K in KnownObjectKeys<T>]: T extends Record<K, unknown> ? K : never;
}[KnownObjectKeys<T>];

/** The key types `T`'s index signatures cover, such as `string` for `Record<string, V>`. */
type IndexKeyOf<T> = Exclude<keyof T, KnownObjectKeys<T>>;

/** Whether `T` always, maybe or never has key `K`; JS stores an integer key as a string. */
type KeyPresence<T, K> =
    K extends RequiredObjectKeys<T>
        ? "always"
        : K extends keyof T
          ? "maybe"
          : K extends number
            ? string extends IndexKeyOf<T>
                ? "maybe"
                : "never"
            : K extends `${number}`
              ? number extends IndexKeyOf<T>
                  ? "maybe"
                  : "never"
              : "never";

/** The value `T` holds at key `K` when it has one; `never` when it cannot. */
type PresentValue<T, K> =
    K extends KnownObjectKeys<T>
        ? Required<T>[K & keyof T]
        : KeyPresence<T, K> extends "never"
          ? never
          : Required<T>[IndexKeyOf<T> & keyof T];

/**
 * A merge result: `V`'s entries, required where `L` or `W` always has the
 * key, plus `L`'s and `W`'s index signatures, each holding `IV` and every
 * entry of `V` whose key it covers.
 */
type MergedEntries<L, W, V, IV> = Simplify<
    {
        [K in keyof V as "always" extends KeyPresence<L, K> | KeyPresence<W, K>
            ? K
            : never]: V[K];
    } & {
        [K in keyof V as "always" extends KeyPresence<L, K> | KeyPresence<W, K>
            ? never
            : K]?: V[K];
    } & {
        [P in IndexKeyOf<L> | IndexKeyOf<W>]:
            | IV
            | V[Extract<
                  keyof V,
                  string extends P
                      ? string | number
                      : number extends P
                        ? number | `${number}`
                        : P
              >];
    }
>;

/** `W`'s entries laid over `L`'s: `W` wins every key it has. */
type OverlayObjects<L, W> = L extends unknown
    ? W extends unknown
        ? MergedEntries<
              L,
              W,
              {
                  [K in KnownObjectKeys<L> | KnownObjectKeys<W>]:
                      | (KeyPresence<W, K> extends "always"
                            ? never
                            : PresentValue<L, K>)
                      | PresentValue<W, K>;
              },
              PresentValue<L, IndexKeyOf<L>> | PresentValue<W, IndexKeyOf<W>>
          >
        : never
    : never;

/** The entries a union's first operand, the data, holds itself: a list's indices or an object's own entries. */
type OwnItems<T> = T extends object ? SpreadItems<T> : Record<never, never>;

/** A union's operands after the first, each read the way `arrayableItems()` reads it; the left-most wins each key. */
type UnionOperands<T extends readonly unknown[]> = T extends readonly [
    infer First,
    ...infer Rest,
]
    ? unknown extends First
        ? Record<string, unknown>
        : OverlayObjects<UnionOperands<Rest>, ArrayableItems<First>>
    : T extends readonly (infer E)[]
      ? number extends T["length"]
          ? Partial<ArrayableItems<E>>
          : Record<never, never>
      : Record<never, never>;

/**
 * Merges a tuple of operands with the left-most winning each key, the way
 * PHP's `+` array union does. The first operand is the data, read by its own
 * entries as `$this->items` is; each later one is read the way
 * `arrayableItems()` reads it, so a Collection-like unwraps, a list adds its
 * indices and a `null` adds nothing.
 *
 * @example
 * MergeObjects<[{ a: 1 }, { a: 2; b: 3 }]> // { a: 1; b: 3 }
 * MergeObjects<[{ a: 1 }, number[]]>       // { [x: number]: number; a: 1 }
 * MergeObjects<[{ all: () => 1 }, { b: 2 }]> // { all: () => 1; b: 2 }
 */
export type MergeObjects<T extends readonly unknown[]> = T extends readonly [
    infer First,
    ...infer Rest,
]
    ? unknown extends First
        ? Record<string, unknown>
        : OverlayObjects<UnionOperands<Rest>, OwnItems<First>>
    : T extends readonly (infer E)[]
      ? number extends T["length"]
          ? Partial<OwnItems<E> | ArrayableItems<E>>
          : Record<never, never>
      : Record<never, never>;

/**
 * The object `{ ...T1, ...T2 }` produces: `T2`'s own entries laid over `T1`'s.
 * A list spreads its indices, and a Map, Set or function spreads nothing.
 *
 * @example
 * SpreadObjects<{ a: 1; b: 2 }, { b: "x" }> // { a: 1; b: "x" }
 * SpreadObjects<{ a: 1 }, { a?: "x" }>      // { a: 1 | "x" }
 */
export type SpreadObjects<T1, T2> = OverlayObjects<
    SpreadItems<T1>,
    SpreadItems<T2>
>;

type ObjectDepth = [never, 0, 1, 2, 3, 4];

/**
 * How `replaceRecursive` treats a value: a list, an object it merges into, or a leaf it replaces.
 * A `Date`, `RegExp`, `Map`, `Set`, `WeakMap`, `WeakSet`, `Promise` or function is a leaf, as a PHP object is.
 */
type MergeKind<T> = T extends readonly unknown[]
    ? "list"
    : T extends NonObjectItems | Date | RegExp | Promise<unknown>
      ? "leaf"
      : T extends object
        ? "object"
        : "leaf";

/** A merged object, or the list it becomes when its keys come out as `0..n-1`. */
type ListOrObject<M> = [
    Exclude<RequiredObjectKeys<M>, number | `${number}`>,
] extends [never]
    ? M | ObjectValue<Required<M>>[]
    : M;

/** What `replaceRecursive` stores when an existing value `A` meets a replacer value `B`. */
type DeepMergeValue<A, B, D extends number> = [D] extends [never]
    ? unknown
    : A extends unknown
      ? B extends unknown
          ? [MergeKind<A>, MergeKind<B>] extends ["object", "object"]
              ? DeepMergeSpread<A, B, ObjectDepth[D]>
              : [MergeKind<A>, MergeKind<B>] extends ["list", "list"]
                ? (
                      | ArrayInnerValue<A>
                      | ArrayInnerValue<B>
                      | DeepMergeValue<
                            ArrayInnerValue<A>,
                            ArrayInnerValue<B>,
                            ObjectDepth[D]
                        >
                  )[]
                : "leaf" extends MergeKind<A> | MergeKind<B>
                  ? B
                  : ListOrObject<DeepMergeSpread<A, B, ObjectDepth[D]>>
          : never
      : never;

/** A nested merge. Only the operand itself is unwrapped, so both sides are read as `{ ...value }` reads them. */
type DeepMergeSpread<A, B, D extends number> = [D] extends [never]
    ? Record<string | number, unknown>
    : DeepOverlayObjects<SpreadItems<A>, SpreadItems<B>, D>;

/** The value at key `K` after a merge: `L`'s alone, `W`'s alone, or both combined. */
type DeepOverlayValue<L, W, K, D extends number> =
    | (KeyPresence<W, K> extends "always" ? never : PresentValue<L, K>)
    | (KeyPresence<L, K> extends "always" ? never : PresentValue<W, K>)
    | DeepMergeValue<PresentValue<L, K>, PresentValue<W, K>, D> extends infer V
    ? V
    : never;

/** `W`'s entries merged into `L`'s: a key both may hold gets `DeepOverlayValue`. */
type DeepOverlayObjects<L, W, D extends number> = L extends unknown
    ? W extends unknown
        ? MergedEntries<
              L,
              W,
              {
                  [K in
                      | KnownObjectKeys<L>
                      | KnownObjectKeys<W>]: DeepOverlayValue<L, W, K, D>;
              },
              DeepOverlayValue<L, W, IndexKeyOf<L> | IndexKeyOf<W>, D>
          >
        : never
    : never;

/**
 * What `replaceRecursive(T1, T2)` returns. `T2` is read the way `arrayableItems()` reads it, but nothing nested is
 * unwrapped; nested lists and plain objects merge by key, as two PHP arrays do, and a built-in object is a leaf.
 * The runtime replaces a class instance whole too, but a type can't tell one from a plain object, so it merges.
 *
 * @example
 * DeepMergeObjects<{ a: { x: 1 } }, { a: { y: 2 } }> // { a: { x: 1; y: 2 } }
 * DeepMergeObjects<{ a: number[] }, { a: string[] }> // { a: (number | string)[] }
 */
export type DeepMergeObjects<T1, T2, D extends number = 5> = [D] extends [never]
    ? Record<string | number, unknown>
    : DeepOverlayObjects<SpreadItems<T1>, ArrayableItems<T2>, D>;

/**
 * The object produced by writing `V` at dot path `P`, creating nested objects
 * for missing or non-object segments the way `Arr::set` creates arrays.
 *
 * @example
 * SetObjectPath<Record<never, never>, "a.b", 1> // { a: { b: 1 } }
 * SetObjectPath<{ a: { x: 1 } }, "a.y", 2>      // { a: { x: 1; y: 2 } }
 */
export type SetObjectPath<T, P extends string, V> = P extends keyof T
    ? Simplify<Omit<T, P> & { [K in P]: V }>
    : P extends `${infer Head}.${infer Rest}`
      ? Simplify<
            Omit<T, Head> & {
                [K in Head]: SetObjectPath<
                    Head extends keyof T
                        ? [PlainObjectOf<T[Head]>] extends [never]
                            ? Record<never, never>
                            : PlainObjectOf<T[Head]>
                        : Record<never, never>,
                    Rest,
                    V
                >;
            }
        >
      : Simplify<Omit<T, P> & { [K in P]: V }>;

/**
 * A value `undot` may produce from leaves of type `V`: the leaf itself, or a
 * list or object nesting more of them.
 */
export type UndotObjectValue<V> =
    | V
    | UndotObjectValue<V>[]
    | { [key: string]: UndotObjectValue<V> };

/**
 * The leaf values left after fully flattening nested arrays and objects the way `flatten()` does: a Collection-like
 * value is read through `all()` first, and a `Date`, `RegExp`, `Map`, `Set`, `Promise` or function is a leaf.
 * The runtime keeps a class instance whole too, but a type can't tell one from a plain object, so it walks it.
 *
 * @example
 * ObjectFlatValue<{ a: [1, 2]; b: { c: "x" } }> // 1 | 2 | "x"
 * ObjectFlatValue<{ a: { all(): number[] } }>   // number
 */
export type ObjectFlatValue<T, D extends number = 5> = [D] extends [never]
    ? unknown
    : FlatLeafValue<
          T extends { all: (...args: never[]) => infer R } ? R : T,
          D
      >;

/** A value `flatten()` has read through `all()`: the leaves of a list or plain object, or the value itself. */
type FlatLeafValue<T, D extends number> = T extends readonly (infer E)[]
    ? ObjectFlatValue<E, ObjectDepth[D]>
    : MergeKind<T> extends "object"
      ? [keyof T] extends [never]
          ? unknown
          : ObjectFlatValue<ObjectValue<T>, ObjectDepth[D]>
      : T;

/**
 * The object members of a resolved type, falling back to a loose record when
 * it has none — `objectItem` throws for a non-object at runtime.
 *
 * @example
 * EnsureObject<{ a: 1 } | null> // { a: 1 }
 * EnsureObject<number>          // Record<string, unknown>
 */
export type EnsureObject<T> = [PlainObjectOf<T>] extends [never]
    ? Record<string, unknown>
    : PlainObjectOf<T>;

/**
 * `T`'s string-keyed entries plus integer-keyed entries holding `V` or `T`'s own
 * integer-keyed values, for helpers that renumber integer keys as they insert.
 *
 * @example
 * RenumberedObject<{ b: 2 }, "x"> // { b: 2 } & Record<number, "x">
 */
export type RenumberedObject<T, V> = Simplify<
    Omit<T, Extract<keyof T, number | `${number}`>>
> &
    Record<
        number,
        V | ObjectValue<Pick<T, Extract<keyof T, number | `${number}`>>>
    >;

/**
 * Every key of `T`, at every depth, made optional: what may remain after an
 * unknown set of dot paths is removed.
 *
 * @example
 * ObjectDeepPartial<{ a: { b: 1 } }> // { a?: { b?: 1 } }
 */
export type ObjectDeepPartial<T, D extends number = 5> = [D] extends [never]
    ? unknown
    : [PlainObjectOf<T>] extends [never]
      ? T
      : { [K in keyof T]?: ObjectDeepPartial<T[K], ObjectDepth[D]> };

/**
 * `T` with the value at dot path `P` removed: a declared key is omitted, a
 * nested path omits its leaf, and a path `T` does not have leaves it unchanged.
 *
 * @example
 * OmitObjectPath<{ a: 1; b: { c: 2; d: 3 } }, "b.c"> // { a: 1; b: { d: 3 } }
 */
export type OmitObjectPath<T, P extends string> = string extends P
    ? ObjectDeepPartial<T>
    : P extends keyof T
      ? Simplify<Omit<T, P>>
      : P extends `${infer Head}.${infer Rest}`
        ? Head extends keyof T
            ? [PlainObjectOf<T[Head]>] extends [never]
                ? T
                : Simplify<
                      Omit<T, Head> & {
                          [K in keyof T as K extends Head ? K : never]:
                              | OmitObjectPath<NonNullable<T[K]>, Rest>
                              | Extract<T[K], null | undefined>;
                      }
                  >
            : T
        : T;

/**
 * `T` with every dot path in the tuple `Ps` removed, left to right.
 *
 * @example
 * OmitObjectPaths<{ a: 1; b: { c: 2 } }, ["a", "b.c"]> // { b: {} }
 */
export type OmitObjectPaths<
    T,
    Ps extends readonly string[],
> = number extends Ps["length"]
    ? ObjectDeepPartial<T>
    : Ps extends readonly [
            infer First extends string,
            ...infer Rest extends readonly string[],
        ]
      ? OmitObjectPaths<OmitObjectPath<T, First>, Rest>
      : T;
