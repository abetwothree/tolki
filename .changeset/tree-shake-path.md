---
"@tolki/path": patch
---

- Bundlers can now drop unused calls to path readers, immutable set and forget, flatten and undot helpers.
- `pushWithPath`, `setMixed` and `pushMixed` are marked as mutating, so bundlers keep their calls.
- esbuild keeps an unused call unless the call site is written `/* @__PURE__ */ fn(...)`.
