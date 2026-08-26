# @tolki/types

## 1.6.0

### Minor Changes

- 74736ef: Add four array-related type helpers, re-exported from the package root.
  - `NonNullableArray<T>` - removes `null` from an array's element type. Used by helpers that filter null values out of an array while preserving the rest of the element type (e.g. `Arr.whereNotNull`).
  - `TruthyArray<T>` - removes the values PHP treats as falsy (`null`, `undefined`, `false`, `0`, `""`) from an array's element type. Used by helpers that filter falsy values out of an array (e.g. `Arr.filter` with no callback).
  - `SortSpec<TValue>` - a single sort descriptor accepted by array sort helpers: a dot-notated key path, a `[key, direction]` tuple, or a comparator function. Used by `Arr.sort` and `Arr.sortDesc`'s multi-key sorting overloads.
  - `PluckValue<TItem, TPath>` - resolves the value type produced by plucking a literal path (including array-segment and `*` wildcard forms) out of each element of an array. Used by `Arr.pluck`'s literal-path overloads.

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
