---
"@tolki/str": minor
---

`substrReplace()` can now work on several strings at once, mirroring an improvement made in Laravel 13.x.

- Pass a list or a plain object of strings as the subject and the replacement is applied to every entry, with the result coming back in the same shape and with the same keys as the input.
- The replacement, offset, and length may each be given as lists to apply a different value to each string by position. Positions without a value fall back to an empty replacement, an offset of `0`, and replacing through the end of the string.
- Behavior change: giving a single string together with a list of replacements now returns a single string built from the first replacement, instead of an array with one result per replacement.
- `substrReplace()` now throws a `TypeError` when a single string is combined with a list of offsets or lengths, matching Laravel and PHP.
