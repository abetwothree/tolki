---
"@tolki/utils": minor
---

New helpers that follow PHP's rules, and fixes so several existing helpers behave the way PHP does.

- **Breaking:** `isPhpFalsy()` now follows PHP for objects: a `Date`, a class instance, or a `Map` or `Set` that isn't empty is truthy, and `0n` is falsy. `compareValues()` and `looseEqual()` use the same rule.
- **Breaking:** `compareValues()` compares an empty object with `null` or a boolean the way it compares an empty array. `operatorMatch()`, which uses it, follows.
- **Breaking:** `arrayableValues()` and `arrayableItems()` no longer unwrap a plain object that has an `all()`, `toArray()` or `toJSON()` method. Only class instances are unwrapped.
- **Breaking:** comparators built by `createSortSpecComparator()` may now return a boolean as well as a number.
- Add `InvalidArgumentException` and `UnexpectedValueException`, thrown where Laravel throws them, and `getCount()` on `MultipleItemsFoundException`.
- Add helpers for PHP's rules on keys, types and numbers: `phpComputedKey`, `isEnumCase`, `isIllegalOffset`, `arrayKeyExistsError`, `hasOwnToString`, `phpDebugType`, `isPhpInt`, `phpIntArgument`, `phpIntCast`, `phpStringCast` and `phpSortComparator`.
- Add helpers that work out sizes and ranges for list operations the way PHP does: `resolveTakeCount`, `resolvePadLength`, `resolveSpliceRange` (with its `SpliceRange` type) and `resolveRangeSize`.
- Fix `typeOf()`'s documentation: `typeOf(null)` returns `"object"`.
