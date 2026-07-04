# @tolki/str

## 1.2.0

### Minor Changes

- dd82d49: Add `counted()` function and `Stringable#counted()` method, ports of Laravel's `Str::counted()`, which pluralize a word with the formatted count prepended (e.g. `counted("order", 2)` -> `"2 orders"`).

  Also widen `plural()` and `Stringable#plural()` to accept an array as the `count` argument, matching Laravel's support for `int|array|Countable` — the array's length is used to determine pluralization.

### Patch Changes

- Updated dependencies [dd82d49]
  - @tolki/num@2.2.0

## 1.1.0

### Minor Changes

- 31edd1f: Add `normalize` option to `studly` and `pascal`

  `studly()`, `pascal()`, and the corresponding `Stringable` methods now accept an optional `normalize` boolean parameter (default `false`). When `true`, all-uppercase words (acronyms) at word boundaries are lowercased before conversion, so each acronym is treated as a single word:

  ```ts
  studly("CBOR"); // → "CBOR"  (default behavior unchanged)
  studly("CBOR", true); // → "Cbor"
  studly("ALL_CAPS", true); // → "AllCaps"
  pascal("ALL_CAPS", true); // → "AllCaps"

  Str.of("CBOR").studly(true).toString(); // → "Cbor"
  Str.of("ALL_CAPS").pascal(true).toString(); // → "AllCaps"
  ```

  Also fixes two type-safety bugs in `Collection.reduce` and `Collection.reduceWithKeys`:
  - `reduce(callback)` on an empty collection with no initial value now throws `TypeError: Reduce of empty collection with no initial value`, matching `Array.prototype.reduce` behavior. Previously it silently returned `undefined` while the overload claimed `TValue`.
  - `reduceWithKeys(callback)` with no initial now defaults to `null` (matching PHP's `$initial = null`), returning `null` on empty collections instead of throwing. This aligns with the existing `TValue | null` overload signature.

## 1.0.14

### Patch Changes

- 3a69d44: Framework sync changes
- Updated dependencies [3a69d44]
  - @tolki/num@2.0.5

## 1.0.13

### Patch Changes

- 68cb120: Sync framework changes with a few Str functions accepting null values instead of throwing errors

## 1.0.12

### Patch Changes

- e8d5904: Framework sync changes
- Updated dependencies [e8d5904]
  - @tolki/num@2.0.4

## 1.0.11

### Patch Changes

- 8d3d0c7: Sync changes and create `resetFactoryState` str function

## 1.0.10

### Patch Changes

- 242bcd8: Sync Laravel changes with new `initials` function

## 1.0.9

### Patch Changes

- 24ca41d: Heading styling on copied documentation to each package readme.md
- Updated dependencies [24ca41d]
  - @tolki/num@2.0.3

## 1.0.8

### Patch Changes

- 62adced: Fix documentation for after string function
- 298c3cd: isUrl regex update (str.ts:677): Updated the domain matching pattern in the URL validation regex to properly handle punycode TLDs.
- b697aa5: Fix docs for take string function
- c08e209: Auto add documentation from VitePress
- Updated dependencies [c08e209]
  - @tolki/num@2.0.2

## 1.0.7

### Patch Changes

- 2bbdea8: Add some type tests and overrides to str functions that can return single strings or array of strings based on input(s)

## 1.0.6

### Patch Changes

- b108941: Fix circular dependency bugs by importing from relative files rather than the packages index.js entry point
- Updated dependencies [b108941]
  - @tolki/num@2.0.1

## 1.0.5

### Patch Changes

- da7a5bf: ## Improve URL validation and deduplicate API

  Enhance Str.isUrl to reject dot-only hosts and URLs with empty authority (e.g. http:///path), allow single-label hosts and punycode, and simplify regex handling (remove unnecessary try/catch). Stringable.deduplicate add tests for deduplication with an array of characters.

- Updated dependencies [9aac0bb]
  - @tolki/num@2.0.0

## 1.0.4

### Patch Changes

- df3cd9a: Small fixes, tests, typings, and make sure proper dependencies are configured
- Updated dependencies [df3cd9a]
  - @tolki/utils@1.0.1
  - @tolki/num@1.0.4

## 1.0.3

### Patch Changes

- c4d3afb: Fully tested, some refactoring, and TypeScript function overloads to better infer function reponses when it's either a string or an array of strings that can be returned

## 1.0.2

### Patch Changes

- Documentation links to str functions

## 1.0.1

### Patch Changes

- Document links to functions and sync Laravel framework changes
- Updated dependencies
  - @tolki/num@1.0.1

## 1.0.0

### Major Changes

- First release of Tolki JS 🎉

### Patch Changes

- Updated dependencies
  - @tolki/num@1.0.0
  - @tolki/utils@1.0.0
