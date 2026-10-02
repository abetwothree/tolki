---
"@tolki/str": patch
---

`trim()`, `rtrim()` and `limit()` no longer become very slow when a long run of whitespace comes before the end of the string. On one machine, `trim()` took about 20 seconds and `rtrim()` about 40 on text with runs of 60,000 whitespace characters; both now take a few milliseconds, following a fix in Laravel.

- `trim()` and `rtrim()` also no longer slow down on a long run of the characters you ask them to trim.
- With `preserveWords` turned on, `limit()` also no longer slows down when the text it keeps is long and has no whitespace at all, such as one 100,000-character word.
