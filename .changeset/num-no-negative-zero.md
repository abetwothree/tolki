---
"@tolki/num": patch
---

`format()`, `percentage()` and `currency()` no longer put a minus sign in front of a number that rounds to zero, matching a recent fix in Laravel. For example, `format(-0.4, 0)` now returns `"0"` instead of `"-0"`, `percentage(-0.4)` returns `"0%"`, and `currency(-0.001)` returns `"$0.00"` instead of `"-$0.00"`. Numbers that still round to something below zero keep their sign, so `currency(-0.006)` is still `"-$0.01"`. `fileSize()` builds on `format()`, so it gets the same fix: `fileSize(-0.4)` now returns `"0 B"` instead of `"-0 B"`.
