---
"@tolki/str": minor
---

String helpers now count characters the way Laravel does, so an emoji counts as one character instead of two and is never cut in half (#155).

- **Breaking:** `limit()` now measures display width, as Laravel does: emoji and Chinese, Japanese or Korean characters count as two. `limit("这是一段中文", 3)` now gives `"这..."`; double the limit to keep the old cut for such text.
- **Breaking:** `limit()` throws for a negative limit larger than the string's width, as Laravel does, instead of returning the end string.
- **Breaking:** `padLeft()`, `padRight()` and `padBoth()` throw for an empty pad string when the value needs padding, instead of returning it unchanged.
- **Breaking:** `position()` returns the offset for an empty needle instead of `false`, and throws for an offset outside the string instead of returning `false`.
- `length()`, `charAt()`, `mask()`, `padLeft()`, `padRight()`, `padBoth()`, `makePad()`, `unwrap()`, `beforeLast()` and `between()` count an emoji as one character.
- `title()`, `headline()` and `convertCase()` capitalize letters outside the Basic Multilingual Plane.
- `deduplicate()` collapses repeated emoji and reads characters such as `.` literally.
- `of(value).split(length)` splits by character, and throws for a length below 1 instead of never returning.
