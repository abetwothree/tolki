---
"@tolki/num": patch
---

Fixed `forHumans()` and `abbreviate()` sometimes printing `"-0"` for small negative numbers that round down to zero at the requested precision. For example, `forHumans(-0.4)` now returns `"0"` instead of `"-0"`.
