---
"@tolki/utils": patch
---

- Bundlers can now drop unused calls to the pure helpers; `defineKey`, `writeMapKey` and `deleteMapKey` stay marked as mutating.
