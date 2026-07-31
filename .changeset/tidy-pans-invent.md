---
"@tolki/num": patch
---

Fixed `summarize()`, and the `forHumans()` and `abbreviate()` helpers built on it, turning very small numbers into large ones. Any value below `0.001` was being scaled up instead of down, so `abbreviate(0.005)` returned `"5"` and `forHumans(0.001)` returned `"1"`. All three now round these values down to `"0"`, and still show the real value when you ask for more precision, so `abbreviate(0.005, 3)` returns `"0.005"`.
