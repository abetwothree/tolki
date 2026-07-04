---
"@tolki/str": minor
---

Add `counted()` function and `Stringable#counted()` method, ports of Laravel's `Str::counted()`, which pluralize a word with the formatted count prepended (e.g. `counted("order", 2)` -> `"2 orders"`).

Also widen `plural()` and `Stringable#plural()` to accept an array as the `count` argument, matching Laravel's support for `int|array|Countable` — the array's length is used to determine pluralization.
