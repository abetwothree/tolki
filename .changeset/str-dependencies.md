---
"@tolki/str": patch
---

Updates `uuid` to 14, `ulid` to 3, `markdown-it-anchor` to 10 and `markdown-it` to 14.3, the 14.x line that still gets security fixes. Output is unchanged.

- `uuid()`, `uuid7()` and `ulid()` now need a global `crypto`, which Node 20+ and every current browser provide.
