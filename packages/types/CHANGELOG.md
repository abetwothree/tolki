# @tolki/types

## 1.9.0

### Minor Changes

- e332aa3: Adds types for resource collections paginated with `simplePaginate()` or `cursorPaginate()`, and for the JSON:API documents a Laravel `JsonApiResource` sends (Laravel 12.45 and later).
  - **Breaking:** type correction: `from` and `to` are `null` on an empty page, so `SimplePaginator`, `LengthAwarePaginator` and `JsonResourceMeta` now type them `number | null`. Code that uses them as a `number` needs a `null` check.
  - `JsonResourceSimplePaginator<T>`, `ResourceSimplePagination` and `JsonResourceSimpleMeta` type a `simplePaginate()` resource collection.
  - `JsonResourceCursorPaginator<T>`, `ResourceCursorPagination` and `JsonResourceCursorMeta` type a `cursorPaginate()` resource collection.
  - `SimplePaginator` and `JsonResourceSimpleMeta` gain an optional `current_page_url`, which Laravel sends from 12.15.
  - `PaginatorLink` gains an optional `page`, which Laravel sends from 12.23 on every link but the `...` separator.
  - `JsonApiDocument`, `JsonApiCollection`, `JsonApiPaginator`, `JsonApiSimplePaginator` and `JsonApiCursorPaginator` type a JSON:API response, given its resource object and what `included` may hold.
  - `JsonApiResourceObject`, `JsonApiResourceIdentifier`, `JsonApiToOneRelationship`, `JsonApiToManyRelationship`, `JsonApiRelationship` and `JsonApiObject` type a document's parts.
  - `JsonApiSparse` types a resource object read with a sparse fieldset, such as `?fields[posts]=title`.

### Patch Changes

- d6942cc: Dot-path types now see through a `Map`, the way the `@tolki` helpers read one. A path that passes through a `Map`, such as `"settings.theme"` on `{ settings: new Map<string, string>() }`, now types the Map's value instead of `null`, and writing through one keeps it typed as a `Map`.
  - `ResolveKey` types a key on a `Map` as the Map's value, or `undefined` because the Map may not hold it, instead of one of the Map's own members: `ResolveKey<Map<string, number>, "size">` is now `number | undefined`, not the type of `size`. `ResolvePath`, `GetFieldType` and `ArrayResolvePath` follow it at every step of a path.
  - `ObjectResolvePath` reads through a `Map` at any step: `ObjectResolvePath<{ m: Map<string, number> }, "m.n">` is `number | null`.
  - `ObjectPathValue` reaches a `Map`'s values and what they hold, instead of the Map's methods.
  - `SetObjectPath` keeps a `Map` on the path a `Map` that holds the new key: `SetObjectPath<{ m: Map<string, number> }, "m.n", true>` is `{ m: Map<string | number, number | true> }`.
  - New `DotReach` types every value `dot()` may keep at some depth, walking into a `Map` as `dot()` does. `FlattenReach` still keeps a `Map` whole, as `flatten()` does.

## 1.8.0

### Minor Changes

- 682a07c: New helper types for the array and collection packages, and a wider `SortSpec`.
  - **Breaking:** a `SortSpec` comparator may now return a boolean as well as a number, because the sort helpers now accept one. Code that reads a comparator's result as a number should check for a boolean first.
  - Add `CollapsedObject`, `FlattenReach` and `FlattenItemReach`, which describe what `collapse()`, `flatten()` and `dot()` return.
  - Add `SpreadArgs`, which describes the arguments a `mapSpread()` or `eachSpread()` callback receives.
  - Deprecate `ProxyTarget` and `PropertyName`. Nothing uses them any more, and the next major version removes them.

## 1.7.0

### Minor Changes

- 94e396e: Fix `ArrayResolvePathOrNull<TArray, TPath>` and `ArrayResolvePathOrDefault<TArray, TPath, TDefault>`: a path through an optional intermediate segment (`{ a?: { b: string } }` at `"0.a.b"`) resolved to `string | undefined`, where `Arr.get` answers its default — `null` when none was given. The `undefined` an optional segment contributes is now swapped for that default, so the resolved type says what the call returns.

  Widen `PathKeys`: its array half is `readonly PathKey[]` rather than `Array<PathKey>`, so an `as const` tuple of keys is accepted wherever a key set is. Nothing reading a key set writes to it. A mutable array still fits. The other direction is breaking: code that _receives_ a `PathKeys` — a parameter or field of its own declared with the type — can no longer call `push`, `sort`, `reverse` or `splice` on the array half, because a `readonly` array has no such methods. Copy it first (`[...keys]`).

  Document `DataIterableItems<TValue, TKey>`: no package source references it yet, and it is kept for `@tolki/collection`, whose constructor and `getArrayableItems` accept exactly that set.

  Add object-side type helpers, re-exported from the package root, used by `@tolki/obj`'s precise overloads.
  - Path resolution: `ObjectResolvePath<T, P, TDefault>` resolves a dot path within an object and adds `TDefault` exactly when the path may not exist (an optional or nullable segment, an index signature, an array index, or an undeclared key). `ObjectPathValue<T>` is every value a path can reach, used for widened `string` paths.
  - Keys and values: `ObjectValue<T>`, `PhpArrayKey<K>` (a canonical integer string key becomes a number, as in PHP), `ObjectKey<T>`.
  - Result shapes: `ReindexedObject`, `TruthyObject`, `NonNullableObject`, `FlipObject`, `PrefixKeys`, `MergeObjects`, `SpreadObjects`, `DeepMergeObjects`, `SetObjectPath`, `OmitObjectPath`, `OmitObjectPaths`, `ObjectDeepPartial`, `RenumberedObject`, `UndotObjectValue`, `ObjectFlatValue`, `EnsureObject`.
  - Utilities: `NonObjectItems`, `Simplify`, `UnionToIntersection`, and `ArrayableItems<T>`: the entries `arrayableItems()` from `@tolki/utils` reads from an operand (a Collection-like unwrapped, a list or Map keyed, `null` empty). A plain-object operand resolves to `T` itself, and the runtime returns that very object rather than a copy, so code holding an `ArrayableItems<T>` and then writing to it mutates the operand — copy first.
  - Internal helpers: `objects.d.ts` and `path-resolve.d.ts` also declare the types these are built from: `PhpFalsyValue`, `PlainObjectOf`, `MapItems`, `SpreadItems`, `OwnItems`, `UnionOperands`, `RequiredObjectKeys`, `IndexKeyOf`, `KeyPresence`, `PresentValue`, `MergedEntries`, `OverlayObjects`, `ObjectDepth`, `MergeKind`, `ListOrObject`, `DeepMergeValue`, `DeepMergeSpread`, `DeepOverlayValue`, `DeepOverlayObjects`, `FlatLeafValue`, `ObjectPathDepth`, `KnownObjectKeys`, `ObjectIndexStep`, `ObjectPathStep`, `ObjectSegmentMissing`, `ObjectPathWalk`, `ObjectPathLeaf`, `ObjectPathTop`, `ObjectKeyStep`, `ObjectPathLiteral` and `IsBareObject`. A `.d.ts` module exports every top-level type, so they can be imported from the package root, but they are implementation details of the helpers above, not supported API.

  Add the types `@tolki/obj` uses to describe a Map, which it now reads in its insertion order: `MapArrayKey<K>` is the key a callback receives for a Map key (the key PHP stores: `MapArrayKey<"10">` is `10`, `MapArrayKey<true>` is `1`, `MapArrayKey<null>` is `""`), and `MapEntryKey<M>` / `MapEntryValue<M>` read the key and value types of a Map, or of a union of Maps, which a `ReadonlyMap<K, V>` parameter cannot infer from. `NonKeyedItems` is `NonObjectItems` without the Map, for a helper that walks a Map but still answers the other non-object values with an empty result, and `MapData<TMap>` is the parameter type that claims a Map, or a union of Maps, while letting `any` through to a helper's other rows. An integer key at or past 2^53 reaches a callback as its digit string, which `MapArrayKey` still types as `number`, the same limit `PhpArrayKey` has for a record key.

## 1.6.0

### Minor Changes

- 74736ef: Add four array-related type helpers, re-exported from the package root.
  - `NonNullableArray<T>` - removes `null` from an array's element type. Used by helpers that filter null values out of an array while preserving the rest of the element type (e.g. `Arr.whereNotNull`).
  - `TruthyArray<T>` - removes the values PHP treats as falsy (`null`, `undefined`, `false`, `0`, `""`) from an array's element type. Used by helpers that filter falsy values out of an array (e.g. `Arr.filter` with no callback).
  - `SortSpec<TValue>` - a single sort descriptor accepted by array sort helpers: a dot-notated key path, a `[key, direction]` tuple, or a comparator function. Used by `Arr.sort` and `Arr.sortDesc`'s multi-key sorting overloads.
  - `PluckValue<TItem, TPath>` - resolves the value type produced by plucking a literal path (including array-segment and `*` wildcard forms) out of each element of an array. Used by `Arr.pluck`'s literal-path overloads.

- 635eb67: Add `UndotArrayKey`, and accept a single-element tuple in `SortSpec`.
  - `UndotArrayKey` — the key shape an array-building undot can represent: a bare numeric index (`0`, `"0"`) or a dot-path whose first segment is numeric (`"0.1"`). Constraining a parameter to this type turns a string-keyed map, which no array can represent, into a compile error instead of data silently discarded at runtime.
  - `SortSpec<TValue>` gains a `readonly [string]` member, so destructuring a descriptor with `const [key, direction] = spec` yields a real, typed `direction: undefined` case rather than reaching it only through an unchecked cast. The existing `string`, `[key, direction]`, and comparator members are unchanged.

  `SortSpec` is widened rather than narrowed, so every value that satisfied it before still does. Code that consumes a `SortSpec` exhaustively — for example a `switch` with an exhaustiveness check — will need to handle the new member.

### Patch Changes

- 919603f: `ProxyTarget` is `object`, not a top-level `this`

  `this` is only legal inside a class or interface member, so the published `export type ProxyTarget = this;` alias never type-checked — `skipLibCheck: true` (the default for consumers, and previously for this repo's own `pnpm ts:check`) hid the `TS2526` error. A `Proxy` target must be an object (`ProxyHandler<T extends object>`), which is what the alias always meant, so it is now `export type ProxyTarget = object;`.

## 1.5.0

### Minor Changes

- e11f2fc: Added a `DataIterableItems` type for helpers that accept more than plain arrays and objects. It covers the same values as `DataItems` plus a `Map` for keyed items and any other iterable, such as a `Set` or a generator, for positional items.

## 1.4.0

### Minor Changes

- Add annotations for route form request data

## 1.3.0

### Minor Changes

- Add route type definitions for Inertia.js route handling

  Introduces type definitions supporting the new route handling system in @tolki/ts:
  - Route definition types for type-safe page prop inference
  - Type helpers for mapping controller responses to Inertia pages
  - Support for route-to-component prop type forwarding
  - Enables full IDE type checking across Laravel controllers and frontend routes

## 1.2.0

### Minor Changes

- f622d6f: New types for upcoming routing functionality

## 1.1.5

### Patch Changes

- cd2d57e: Minor fixes and improvements

## 1.1.4

### Patch Changes

- 53a5a05: Default the folder to be "data" and fix enum types to properly catch when any helper properties are missing

## 1.1.3

### Patch Changes

- Updated types for enum package

## 1.1.2

### Patch Changes

- db71d46: Make enum \_cases, \_methods, & \_static enum properties optional.

## 1.1.1

### Patch Changes

- 24ca41d: Heading styling on copied documentation to each package readme.md

## 1.1.0

### Minor Changes

- 655ed22: Addition of helper enum types to support enum package

### Patch Changes

- c08e209: Auto add documentation from VitePress

## 1.0.2

### Patch Changes

- df3cd9a: Small fixes, tests, typings, and make sure proper dependencies are configured

## 1.0.1

### Patch Changes

- Updated JsonResource to JsonResourcePaginator per documentatin and ready for proper 3rd party use

## 1.0.0

### Major Changes

- First release of Tolki JS 🎉
