---
"@tolki/num": minor
---

Format non-finite values (`Infinity`, `-Infinity`, `NaN`) in `fileSize`, `forHumans`, and `abbreviate` instead of coercing them to `0`. Matches Laravel's `Number` class, which now renders these as `"∞ B"`, `"-∞ B"`, `"NaN B"`, `"∞"`, `"-∞"`, and `"NaN"` respectively.
