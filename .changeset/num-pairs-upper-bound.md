---
"@tolki/num": patch
---

`pairs()` no longer drops the last value of the range when the final step lands exactly on it, matching a recent fix in Laravel. For example, `pairs(20, 10)` now returns `[[0, 9], [10, 19], [20, 20]]` instead of stopping at `[10, 19]`. Ranges whose last pair already ends on the upper value are unchanged, so `pairs(20, 10, 0, 0)` is still `[[0, 10], [10, 20]]`.
