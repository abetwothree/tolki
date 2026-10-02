---
"@tolki/str": patch
---

`finish()` no longer slows to a crawl on a long string that holds a long run of the cap before its end, such as thousands of slashes followed by other text. It now takes time in proportion to the string's length, following a similar change in Laravel. `finish()` and `start()` return the same results as before.
