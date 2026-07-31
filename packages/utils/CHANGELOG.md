# @tolki/utils

## 1.1.0

### Minor Changes

- e11f2fc: Added an `isIterable()` check that tells you whether a value can be looped over with `for...of`, such as an array, a `Set`, a `Map`, or a generator. Strings are deliberately reported as not iterable so they keep being treated as single values rather than as a list of characters.

### Patch Changes

- Updated dependencies [e11f2fc]
  - @tolki/types@1.5.0

## 1.0.2

### Patch Changes

- b414314: Fix Prototype-polluting assignment CodeQL warnings

## 1.0.1

### Patch Changes

- df3cd9a: Small fixes, tests, typings, and make sure proper dependencies are configured
- Updated dependencies [df3cd9a]
  - @tolki/types@1.0.2

## 1.0.0

### Major Changes

- First release of Tolki JS 🎉
