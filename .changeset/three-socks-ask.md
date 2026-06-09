---
"@tolki/num": minor
---

- `fileSize()` now correctly handles negative byte values (e.g. `-2048` → `"-2 KB"`)
- `pairs()` now throws an `Error` when `by` is `0`, and treats negative `by` values the same as positive ones
- `trim()` now returns `Infinity`, `-Infinity`, and `NaN` as-is instead of converting them to `null`
