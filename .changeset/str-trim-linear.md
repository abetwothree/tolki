---
"@tolki/str": patch
---

`trim()`, `rtrim()` and `limit()` no longer slow to a crawl on a string that holds a long run of whitespace, or of the characters being trimmed, somewhere before its end: trimming a string with 60,000 whitespace characters in its middle took over 20 seconds and now takes a few milliseconds. The results are unchanged, and the change follows a fix in Laravel.
