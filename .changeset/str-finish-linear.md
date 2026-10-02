---
"@tolki/str": patch
---

`finish()` no longer becomes slow when a long run of the cap comes before the end of the string, such as tens of thousands of slashes followed by other text. It now takes time in proportion to the string's length, following a similar change in Laravel; `finish()` and `start()` return the same results as before.
