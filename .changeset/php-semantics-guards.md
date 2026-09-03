---
"@tolki/utils": minor
---

Add two guards that follow PHP's semantics rather than JavaScript's, re-exported from the package root.

- `isPhpFalsy(value)` — falsy the way PHP's `array_filter()` with no callback treats a value. Drops `false`, `null`/`undefined`, `0`, `""`, `"0"`, and empty arrays and plain objects, but keeps `"00"`, `"0.0"`, and `NaN`, all of which are truthy in PHP. The existing `isFalsy` cannot be used for this: it treats `NaN` as falsy, does not treat the exact string `"0"` as falsy, and treats whitespace-only strings as falsy where PHP does not.
- `isPhpNumeric(value)` — numeric the way PHP's `is_numeric()` treats a value, matching PHP's numeric-string grammar: optional surrounding PHP whitespace, an optional sign, digits with an optional decimal point on either side (so both `".5"` and `"5."` qualify), and an optional exponent. `Number(value)` cannot be used for this: `""`, `" "`, and `"0x10"` are numeric to JavaScript but not to PHP (hex strings stopped being numeric in PHP 7), and `"Infinity"` has no PHP numeric-string spelling.

Both are additive. No existing export changed behaviour, and neither guard claims full PHP exactness for JavaScript values that have no PHP counterpart, such as `Date`, `Map`, or `RegExp` instances.
