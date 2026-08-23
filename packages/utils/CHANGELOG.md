# @tolki/utils

## 1.2.0

### Minor Changes

- 5174f99: Add `isPhpArrayKey()` and `defineKey()`, the two helpers `@tolki/arr` and `@tolki/obj` need to build PHP-compatible flipped keys. Both previously existed as private copies in each of those packages.

  `isPhpArrayKey()` reports whether a value is one PHP would accept as an array key.
  - PHP array keys are strings and integers in the inclusive range `[-2^63, 2^63 - 1]`. Anything else — floats, booleans, `null`, `undefined`, arrays, objects, functions, and symbols — is rejected, so callers never build a key PHP could not produce.
  - The lower bound is inclusive, so `PHP_INT_MIN` (exactly `-2^63`) is accepted. The upper bound stays exclusive because `PHP_INT_MAX` is not representable as a JavaScript double: `2^63 - 1` rounds to `2^63`, which makes the largest candidate that can reach the check a valid key already.
  - The copies this replaces used a magnitude test (`Math.abs(value) < 2 ** 63`) that rejected `PHP_INT_MIN`, causing `flip()` to drop a value that PHP's `array_flip()` keeps.

  `defineKey()` defines an own enumerable property on an object without going through a setter.
  - A key such as `__proto__` becomes a real own key rather than reaching `Object.prototype` through the inherited setter, so building a result object out of untrusted values cannot pollute the prototype.
  - The property is writable and configurable, so it otherwise behaves like plain assignment.

### Patch Changes

- 77323d4: Fix built declaration files emitting a dist-relative specifier for cross-package type imports (e.g. `../../../types/src/index` instead of `@tolki/types`), which resolved nowhere once installed from npm.

  The dts plugin now excludes `@tolki/*` aliases from resolution, so these imports emit as bare package specifiers that consumers resolve through `node_modules`, matching the corresponding runtime `dependencies` entry.

  No API changed — this only corrects the emitted type specifier.

- 35fb407: Split the package source by concern instead of one flat module.

  `utils.ts` had grown to 1032 lines and 47 exports in a single file, with no grouping and new helpers appended to the bottom. It is now a barrel over six focused modules: `guards.ts` (type guards), `cast.ts` (conversion), `equality.ts` (comparison), `keys.ts` (object keys), `string.ts` (shared string helpers), and `reflect.ts` (runtime type reflection). Tests mirror the same layout.

  This is an internal reorganization: every export keeps its name, signature, and behavior, and both the `@tolki/utils` and `@tolki/utils/utils` entry points resolve exactly as before, so no consuming code changes.

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
