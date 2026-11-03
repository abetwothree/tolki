---
"@tolki/str": minor
---

`substrCount()` now throws for an empty needle, as Laravel does.

- **Breaking:** `substrCount(value, "")` and `of(value).substrCount("")` throw an error instead of returning `0`. Check for an empty needle before calling if it can be empty.
