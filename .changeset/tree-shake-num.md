---
"@tolki/num": patch
---

- Unused calls to num's side-effect-free helpers now drop out of bundles, including the formatters, parsers, `ordinal`, `percentage`, `currency`, `fileSize`, `forHumans`, `summarize`, `clamp`, `pairs`, `trim`, the duration helpers, `defaultLocale`, `defaultCurrency`, and the async `spell` and `spellOrdinal`.
- `useLocale` and `useCurrency` write the module defaults, and `withLocale` and `withCurrency` run a callback around a temporary swap of them, so a call to any of the four is always kept.
- In Rspack, an unused call to `spell` or `spellOrdinal` can leave the loader code for its dynamic `import()` behind unless the call is written `/* @__PURE__ */ spell(...)`.
