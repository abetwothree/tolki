---
"@tolki/str": minor
---

Case-insensitive string replacement now works correctly and understands accented characters.

- Fixed the `caseSensitive` option of `replace()` doing the opposite of what it said: passing `false` now correctly ignores letter casing, and the default (`true`) now only replaces exact matches, the same way Laravel behaves.
- `replace()` and `remove()` now match accented and other non-English characters when ignoring case. For example, removing `"ž"` also removes `"Ž"`. Plain English letters still only match their own upper and lower case forms, so `"s"` will not match the lookalike `"ſ"`. This mirrors the improvement recently made in Laravel.
- When searching for several terms at once, a single replacement string is now applied to every term instead of only the first one.
- `replace()` now throws a `TypeError` when given a single search string together with a list of replacements, matching Laravel and PHP.
- Non-string values inside lists of search terms, replacements or subjects passed in from plain JavaScript are now converted to strings instead of crashing, the same way PHP casts them.
