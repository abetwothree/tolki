# @tolki/utils

## 1.3.0

### Minor Changes

- 635eb67: Add two guards that follow PHP's semantics rather than JavaScript's, re-exported from the package root.
  - `isPhpFalsy(value)` — falsy the way PHP's `array_filter()` with no callback treats a value. Drops `false`, `null`/`undefined`, `0`, `""`, `"0"`, and empty arrays and plain objects, but keeps `"00"`, `"0.0"`, and `NaN`, all of which are truthy in PHP. The existing `isFalsy` cannot be used for this: it treats `NaN` as falsy, does not treat the exact string `"0"` as falsy, and treats whitespace-only strings as falsy where PHP does not.
  - `isPhpNumeric(value)` — numeric the way PHP's `is_numeric()` treats a value, matching PHP's numeric-string grammar: optional surrounding PHP whitespace, an optional sign, digits with an optional decimal point on either side (so both `".5"` and `"5."` qualify), and an optional exponent. `Number(value)` cannot be used for this: `""`, `" "`, and `"0x10"` are numeric to JavaScript but not to PHP (hex strings stopped being numeric in PHP 7), and `"Infinity"` has no PHP numeric-string spelling.

  Both are additive. No existing export changed behaviour, and neither guard claims full PHP exactness for JavaScript values that have no PHP counterpart, such as `Date`, `Map`, or `RegExp` instances.

- 72bafff: Add `phpValueMatcher(others)`, re-exported from the package root.
  - `phpValueMatcher(others)` — builds a reusable `phpValueMatch`-equivalent membership test against a fixed list of operands: cast operands go into a `Set` once, so repeated membership checks (as `Arr.diff`/`Arr.intersect` and `Obj.diff`/`Obj.intersect` perform per item) run in O(1) instead of rescanning `others` on every call. Values with no PHP scalar cast keep the exact `phpValueMatch` fallback semantics via a small residual list.

- c10a894: `looseEqual()` now follows PHP 8's comparison rules instead of PHP 7's.
  - A number compared with text that is not a number is no longer considered equal just because both are "empty" or "zero-like". For example `0` and `""` are now different, as they are in PHP 8, and so are an empty list and `0`.
  - Two numeric strings, or a number and a numeric string, are compared as numbers even when spelled differently: `"1e1"` equals `"10"`, and `"1"` equals `"01"`, matching PHP.
  - `null` compared with text behaves like an empty string (`null` equals `""` but not `"0"`); compared with anything else it behaves like `false`, exactly as PHP does.
  - An object with no properties is now treated as empty, so it matches `false` and no longer matches `true`. A plain object stands in for a PHP associative array here, and an empty array is "empty" in PHP. Objects that carry their own behaviour, such as `Date`, `Map`, `Set` and instances of your own classes, are unaffected.
  - A plain object that defines its own `toString()` is no longer considered equal to the text that method returns, because PHP never converts an array to a string to compare it. An instance of a class, or a built-in such as a `Date`, still compares by its string form, the way PHP uses `__toString`.

  This affects every helper in the `@tolki` packages that uses PHP-style loose comparison, such as `contains()`, `where()` with `==`, `unique()` and `search()` when not in strict mode.

- 87e0087: Add `isPrototypeObject(value)`, re-exported from the package root, and use it to close a prototype-pollution hole in `defineKey`.
  - `isPrototypeObject(value)` — true when `value` is the `prototype` of the constructor it carries as an own property, so `Object.prototype`, `Array.prototype`, `Function.prototype` and every class's prototype qualify, while an ordinary object, an array, and a constructor look-alike such as `{ constructor: Object }` do not. It recognises a prototype only by an own _function_ `constructor`, so it does not detect `%IteratorPrototype%` and the other intrinsics whose `constructor` is an accessor or absent, nor a `Proxy` wrapping a prototype -- a transparent proxy is not distinguishable from its target in JavaScript. Neither `isObject` nor `isObjectAny` can stand in for it: `Array.prototype` is array-shaped and `Object.prototype` is object-shaped, so a shape test cannot tell a shared prototype apart from ordinary data.
    This is a breaking change: `defineKey` declines writes it previously performed.
  - `defineKey(target, key, value)` now refuses a `target` that is a prototype object and returns without writing. Every value inheriting from that prototype would otherwise observe the write, so a caller-supplied path reaching one is a global mutation, not a property assignment. Writes to any other target are unchanged.

- 6e25bc3: Add five helpers and a type, widen one existing signature, and correct one existing helper's behaviour to match PHP.
  - `phpValueMatch(a, b)` — value equivalence by PHP's `(string)` cast, as `array_diff` and `array_intersect` use. Falls back to SameValueZero for values with no PHP scalar cast (`undefined`, symbols, functions, objects, arrays, `Date`, `NaN`, `Infinity`).
  - `isIntegerLikeKey(key)` — the non-negative integer-key grammar every reordering helper (`sort`, `sortDesc`, `sortBy`, `reverse`, `pad`, `splice`, `sortKeys`, `sortKeysDesc`, `sortKeysUsing`) renumbers under: `0` or a leading non-zero digit run, no sign, no exponent, no leading zeros. Deliberately narrower than PHP's own int-cast rule, which also treats negative integers as array keys — a JS engine never re-sorts those, so leaving them alone already matches PHP's order.
  - `reindexIntegerKeys(entries)` — renumber an entry list's integer-like keys to a fresh 0-based sequence, in the order they appear, leaving string keys untouched. The one integer-key policy shared by every reordering helper above.
  - `createSortSpecComparator(resolve)` — builds the comparator one `SortSpec` descriptor implies. `@tolki/utils` sits below every path package, so the caller injects how to read a descriptor's key off an item: `getNestedValue` for `@tolki/arr`/`@tolki/obj`, `dataGet` for `@tolki/collection`. Returns a function of shape `<TValue>(spec: SortSpec<TValue>, forceDescending: boolean) => (a: TValue, b: TValue) => number`.
  - `SortValueResolver` — the resolver type `createSortSpecComparator` takes: `(item: unknown, key: PathKey) => unknown`.
  - `defineKey(target, key, value)` now accepts any `PropertyKey` as `key` (previously `string` only), and falls back to plain assignment when the target's existing key is non-configurable — previously this threw.
  - `arrayableValues(items)` — read an operand's values the way `Arr::from`'s `getArrayableItems` does, unwrapping an `all()`/`toArray()`/`toJSON()`-bearing object, a `Map`, or any other iterable before reading them.

  **Breaking change:**
  - `compareValues(a, b)` now orders values the way PHP 8's `<=>` does on the scalar axis: two numeric strings compare as `BigInt` when both are plain integers (exact past 2^53) or as `Number` otherwise, with a string-order fallback when both collapse to the same infinity; a number against a non-numeric string no longer ties; and a `null` or boolean operand on either side compares both sides as PHP booleans, so `null` now ties `0`, `false`, `""` and `[]` instead of ranking below all of them. Every sort in `@tolki/arr`, `@tolki/obj` and `@tolki/collection` routes through this comparator, so calls such as `Arr.sort(["9","10"])` or `Collection.sortBy` now order numeric strings, mixed number/string pairs, and PHP-falsy values differently than before.

  Code relying on `compareValues`' previous JavaScript-shaped ordering will observe different results. `arrayableValues` is new in this release and has no prior published behaviour.

- 9858cd0: Add the four helpers `@tolki/arr` and `@tolki/obj` each kept a private copy of.
  - `phpTypeName(value)` — a value's type name as PHP's `gettype()` renders it: `"NULL"` for `null` and `undefined`, `"integer"` for an integral number, `"double"` for a non-integral one and for `NaN`/`Infinity`, `"array"` for an array, `"object"` for a function, and the JavaScript `typeof` for shapes PHP has no word for (`symbol`, `bigint`). Deliberately **not** the same function as `typeOf`, which answers `"object"` for `null` and `"number"` for every number; both spellings appear in Laravel-parity error messages and neither can stand in for the other.
  - `arrayValueMessage(value, key)` — `Arr::array()`'s exact `Array value for key [%s] must be an array, %s found.` message, so every array guard across `@tolki/arr`, `@tolki/obj` and `@tolki/path` throws one string.
  - `cssListItemToString(value)` — the cast PHP applies when a CSS class or style fragment is pushed raw into `implode()`/`Str::finish()`: `null` and `undefined` become `""`, a boolean becomes `"1"`/`""`, everything else goes through `String()`.
  - `resolveSliceRange(count, offset, length)` — resolves `array_slice`'s offset/length pair into the `{ start, end }` window `Array.prototype.slice` takes, normalising a negative offset against the item count before combining it with the length. Its return type `SliceRange` is exported alongside it.

### Patch Changes

- Updated dependencies [74736ef]
- Updated dependencies [919603f]
- Updated dependencies [635eb67]
  - @tolki/types@1.6.0

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
