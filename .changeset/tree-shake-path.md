---
"@tolki/path": patch
---

- Bundlers can now drop unused calls to the pure path helpers; `pushWithPath`, `setMixed` and `pushMixed` stay marked as mutating.
