---
"@tolki/num": patch
---

`pairs()` now throws an `InvalidArgumentException` when `by` is `0`, the same error and message Laravel uses. It is still an `Error`, so code that already catches errors from `pairs()` keeps working, and you can import `InvalidArgumentException` from `@tolki/utils` to check for it.
