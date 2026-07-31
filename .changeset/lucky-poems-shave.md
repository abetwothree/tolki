---
"@tolki/str": patch
---

Fixed `wordWrap()` and `Stringable#wordWrap()` breaking lines too early when the text contains emoji or other characters made up of a surrogate pair. The line width is now counted in real characters rather than in the units JavaScript uses to store them internally, so `wordWrap("😀😀😀😀", 2, "\n", true)` now returns `"😀😀\n😀😀"` instead of putting every emoji on its own line.
