---
"@tolki/utils": major
---

`looseEqual()` now follows PHP 8's comparison rules instead of PHP 7's.

- A number compared with text that is not a number is no longer considered equal just because both are "empty" or "zero-like". For example `0` and `""` are now different, as they are in PHP 8, and so are an empty list and `0`.
- Two numeric strings, or a number and a numeric string, are compared as numbers even when spelled differently: `"1e1"` equals `"10"`, and `"1"` equals `"01"`, matching PHP.
- `null` compared with text behaves like an empty string (`null` equals `""` but not `"0"`); compared with anything else it behaves like `false`, exactly as PHP does.

This affects every helper in the `@tolki` packages that uses PHP-style loose comparison, such as `contains()`, `where()` with `==`, `unique()` and `search()` when not in strict mode.
