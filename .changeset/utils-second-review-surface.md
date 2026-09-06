---
"@tolki/utils": major
---

Add five helpers and a type, widen one existing signature, and correct one existing helper's behaviour to match PHP.

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
