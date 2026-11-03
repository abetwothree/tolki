---
"@tolki/collection": patch
---

`mode()` now returns float values as they are, as Laravel 13.38 does. Before, `collect([1.5, 1.5, 2.5]).mode()` returned `[1]` instead of `[1.5]`.
