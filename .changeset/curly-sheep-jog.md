---
"@tolki/num": major
---

## BREAKING: Async spell and spellOrdinal with to-words v5

`spell()` and `spellOrdinal()` are now async and return `Promise<string>` instead of `string`. This is required for tree-shakeable per-locale dynamic imports from `to-words` v5.

### Breaking Changes

- `spell()` now returns `Promise<string>` — callers must use `await`
- `spellOrdinal()` now returns `Promise<string>` — callers must use `await`
- `spellOrdinal()` now returns true ordinal words (e.g., "First", "Second", "Third") instead of cardinal words ("One", "Two", "Three")

### Improvements

- Upgraded `to-words` from v4 to v5 with tree-shakeable per-locale imports (~3KB gzip per locale vs ~54KB full bundle)
- Dynamic `import()` loads only the requested locale on demand, fixing test timeouts on Windows + Node 24
- Language-code fallback map covers all 60 `to-words` locale prefixes
- Native ordinal support via `to-words` v5 `toOrdinal()`
