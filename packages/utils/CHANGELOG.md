# @tolki/utils

## 1.4.0

### Minor Changes

- 4fecd5b: **Breaking.** `compareValues(a, b)` orders two arrays or objects by PHP's array-comparison rule instead of by their `JSON.stringify` form: the operand with fewer entries sorts first, and only when the counts match are the entries compared one by one over the left operand's own keys, recursing through `compareValues`. A key the right operand lacks makes the pair uncomparable, which PHP answers `1` for from either side. Every sort in this monorepo runs through this comparator, so results change: `[{ id: 2 }, { id: 10 }, { id: 1 }]` now sorts to `[{ id: 1 }, { id: 2 }, { id: 10 }]` rather than to the order of the three JSON strings. Two `Date`s are the exception to that rule: they compare by time value, as PHP compares two `DateTime` objects chronologically rather than by their property tables. Cyclic input no longer throws — a pair the walk is already comparing ties, where PHP raises `Error: Nesting level too deep`. Three further divergences from PHP remain. An array against a scalar keeps JavaScript's coercion rather than sorting above every scalar. A `Date` against an array or a plain object keeps the entry-count rule, where PHP sorts every object above every array: `compareValues(new Date('2020-01-01'), [])` is `0` where PHP's `new DateTime('2020-01-01') <=> []` is `1`, and `compareValues([], new Date('2020-01-01'))` is `0` where PHP's `[] <=> new DateTime('2020-01-01')` is `-1`. (PHP's `1`-from-either-side answer is real, but it belongs to two _objects_ of different classes, and a plain object models a PHP array here, so it is not the pair this clause describes.) And an empty plain object ordered against `null` or a boolean is read as truthy, where PHP casts an empty array to `false`: `compareValues({}, null)` and `compareValues({}, false)` are `1` where PHP's `[] <=> null` and `[] <=> false` are `0`, and `compareValues({}, true)` is `0` where PHP's `[] <=> true` is `-1` — the array spelling agrees with PHP in all three. A `Map`, a `Set` or a `RegExp` has no PHP analogue and no own enumerable keys, so any two of them still tie — a JavaScript-only decision rather than a divergence.

  Add `phpArrayKey(key)`: the key PHP stores for an array key. A canonical decimal integer string ("10", "-1") becomes a number; every other string ("01", "1.5", " 1") stays as it is. Any other value is cast the way PHP casts an array offset: `null` becomes `""`, a boolean `0` or `1`, and a float is truncated toward zero (`INF` and `NAN` become `0`).

  Add `toPhpKeyString(value)`: the string key PHP's `array_combine` stores a value under. `null`, `undefined` and `false` become `""`, `true` becomes `"1"`, a number prints the way PHP's `(string)` cast prints it (`INF`, `-0`, `1.0E+21`, 14 significant digits), and anything else is stringified.

  Fix `strictEqual(a, b)`: two plain objects holding the same entries in a different key order are no longer equal, matching PHP's `===` on arrays.

  Add `isPlainObject(value)`: whether a value is a plain object, one whose prototype is `Object.prototype` or `null`. Arrays, class instances and built-ins such as `Date` and `Map` are not.

  Add `isPhpAccessible(value)`: whether a value carries array entries rather than object state, which is what PHP's `Arr::accessible` asks. An array, a plain object and a `Map` are accessible; a `Date`, a `Set`, a `WeakMap`, a `RegExp` or a class instance is not, because its state does not live on its own enumerable keys — PHP rejects a `DateTime` for the same reason.

  Add `renumberPhpIntegerKeys(entries)`: renumber every key PHP stores as an integer to a fresh 0-based sequence, in the order given, as `array_shift`, `array_splice` and `array_unshift` do. Unlike `reindexIntegerKeys`, a negative key such as `"-1"` counts too.

  Add `ItemNotFoundException` and `MultipleItemsFoundException`, ports of Laravel's two `Illuminate\Support` exceptions, from a new `exceptions` module re-exported from the package root. `ItemNotFoundException` carries no message, as Laravel's does not; `MultipleItemsFoundException(count)` carries `"{count} items were found."` and exposes the `count`. `sole` in `@tolki/arr`, `@tolki/obj` and `@tolki/collection`, and `firstOrFail` in `@tolki/collection`, now throw these instead of a plain `Error` with a message of this port's own invention.

  Deprecate `entriesKeyValue(key)` in favour of `phpArrayKey(key)`. Its `Number()`/`parseFloat` conversion is looser than PHP's: it turns `"01"` into `1`, `"1.5"` into `1.5` and `"0x10"` into `16`, keys PHP would all keep as strings, so a callback handed such a key was told the wrong one. It is still exported and still behaves the same.

  Add `arrayableItems(items)`: the keyed twin of `arrayableValues`. It normalizes an operand the way Laravel's `getArrayableItems()` does, returning its entries as a plain object: nullish becomes `{}`, an Enumerable/Arrayable-like object unwraps via `all()`/`toArray()`/`toJSON()`, a Map, list or other iterable becomes an object, and a WeakMap or WeakSet, whose entries can't be read, becomes `{}`. A Map's keys are cast as PHP casts an array key, so `1` and `"1"`, or `true` and `1`, land on one key holding the last value. A plain object is the one operand returned as-is rather than copied, so a caller that mutates the result writes through to its own input — copy first. PHP's array value semantics hide that in Laravel; JavaScript's do not.

  Add `operatorMatch(retrieved, operator, value)`: compare two values with one of PHP's `where()` operators (`=`, `==`, `!=`, `<>`, `<`, `>`, `<=`, `>=`, `===`, `!==`, `<=>`), the way Laravel's `EnumeratesValues::operatorForWhere()` does. An unrecognised operator falls through to `=`, as PHP's `switch` default does; `=`, `==`, `!=` and `<>` compare with `looseEqual`, and every ordering operator orders through `compareValues` rather than JavaScript's own `<`, so PHP's comparison casts apply: `null` is ordered rather than refused (`1 > null`, `-1 > null`, `null < 1` and `0 <= null` all hold, because `null` casts to `false` against a number and to `""` against a string), and two numeric strings compare numerically, so `"10" > "9"` holds. When exactly one side is an object and the pair holds fewer than two strings, only `!=`, `<>` and `!==` answer true. That short-circuit is **Laravel's own**, not PHP's: it sits ahead of the `switch` in `EnumeratesValues::operatorForWhere()` (`src/Illuminate/Collections/Traits/EnumeratesValues.php:1166`). Raw PHP _does_ order such a pair — it emits `Notice: Object of class P could not be converted to int` and then compares as if the object were `1`, so `$p <=> 5` is `-1` and `$p <=> 0` is `1`. A **plain object is not one of those objects**, because it models a PHP array here, exactly as it does in `looseEqual` and `compareValues`; a class instance, a `Date`, a `Map` or a `Set` is. A string or an object carrying its own `toString` is what counts toward the pair's two strings, which is PHP's `is_string`/`\Stringable` test; a `Date` counts there too, where PHP's `DateTime`, having no `__toString`, would not — the same JavaScript-only reading `looseEqual` already takes. `===` and `!==` compare through `strictEqual`, which is PHP's rule for `===` on an array — same keys, in the same order, with the same types, recursing — rather than JavaScript's own reference identity, so `[1, 2] === [1, 2]` and `{ a: 1 } === { a: 1 }` both hold while `{ a: 1, b: 2 } === { b: 2, a: 1 }` and two distinct `Date`s do not. `NaN` is uncomparable against a number or a string, so `<`, `>`, `<=` and `>=` are all false there and `<=>` answers true, because PHP's `NAN <=> 1` is `1` rather than `0`; against a **bool or null** PHP casts both sides to bool and orders normally, so `NAN <=> true` is `0` — the pair ties, `<=` and `>=` hold, and `<=>` is false — while `NAN <=> null` is `1`. Two divergences remain, both inherited from `compareValues`. An array or a plain object ordered against a scalar keeps JavaScript's coercion rather than sorting above every scalar, so `operatorMatch({ x: 1 }, '>', 'abc')` is false where PHP's `['x' => 1] > 'abc'` is true. And an **empty plain object** ordered against `null` or a boolean is read as truthy, where PHP casts an empty array to `false`: `compareValues({}, null)` and `compareValues({}, false)` are `1` where PHP's `[] <=> null` and `[] <=> false` are `0`, and `compareValues({}, true)` is `0` where PHP's `[] <=> true` is `-1`. The array spelling of the same PHP value agrees with PHP in all three. JS-only: `undefined` has no PHP analogue, and is ordered exactly as `null` is — the value this port stores for a path PHP would read as null. `contains`'s key/operator/value form in `@tolki/arr` and `@tolki/obj` is built on it.

  Add `keyedEntries(data)`: the entries of a plain object or a Map, each keyed by the string a plain object holds for that key. A plain object answers exactly what `Object.entries` does. A Map is read in its own insertion order, the one JavaScript structure that can hold a PHP array whose integer keys are out of sequence (`[2 => 'c', 0 => 'a']`), since a plain object always lists integer keys ascending. Each Map key is cast as PHP casts an array key, and keys PHP stores as one fold into the first one's place holding the last one's value: `keyedEntries(new Map([[1, 'a'], [0, 'z'], ['1', 'b']]))` is `[['1', 'b'], ['0', 'z']]`. A key PHP cannot store (an object, a function or a symbol) keeps its own entry under its string form.

  `arrayableValues(items)` reads a Map as the PHP array it stands for, through `keyedEntries`: one value per key PHP stores, in the Map's insertion order. `arrayableValues(new Map([[1, 'a'], ['1', 'b']]))` is now `['b']`, where it was `['a', 'b']`.

### Patch Changes

- Updated dependencies [94e396e]
  - @tolki/types@1.7.0

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
