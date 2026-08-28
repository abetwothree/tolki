---
"@tolki/utils": minor
---

Add the four helpers `@tolki/arr` and `@tolki/obj` each kept a private copy of.

- `phpTypeName(value)` — a value's type name as PHP's `gettype()` renders it: `"NULL"` for `null` and `undefined`, `"integer"` for an integral number, `"double"` for a non-integral one and for `NaN`/`Infinity`, `"array"` for an array, `"object"` for a function, and the JavaScript `typeof` for shapes PHP has no word for (`symbol`, `bigint`). Deliberately **not** the same function as `typeOf`, which answers `"object"` for `null` and `"number"` for every number; both spellings appear in Laravel-parity error messages and neither can stand in for the other.
- `arrayValueMessage(value, key)` — `Arr::array()`'s exact `Array value for key [%s] must be an array, %s found.` message, so every array guard across `@tolki/arr`, `@tolki/obj` and `@tolki/path` throws one string.
- `cssListItemToString(value)` — the cast PHP applies when a CSS class or style fragment is pushed raw into `implode()`/`Str::finish()`: `null` and `undefined` become `""`, a boolean becomes `"1"`/`""`, everything else goes through `String()`.
- `resolveSliceRange(count, offset, length)` — resolves `array_slice`'s offset/length pair into the `{ start, end }` window `Array.prototype.slice` takes, normalising a negative offset against the item count before combining it with the length. Its return type `SliceRange` is exported alongside it.
