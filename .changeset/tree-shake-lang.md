---
"@tolki/lang": patch
---

- Unused calls to lang's side-effect-free helpers now drop out of bundles, including `createLang`, `bindLang`, `createHelpers`, `choose`, `getPluralIndex`, `makeReplacements`, `normalizeLocale`, `htmlLocale`, the Svelte `getLang` and `langContext`, the React `LangProvider`, and the `laravelLangExport` plugin factory.
- `assertLocale` is called to throw, `setLang` writes Svelte component context, the React `useLang` subscribes the calling component, and the Vue `useLang` shares that mark (it only calls `inject`, during setup), so a call to them is always kept.
- In Rspack, an unused call to `createLang` (main and Vue entries) can leave `@tolki/utils` code behind unless the call is written `/* @__PURE__ */ createLang(...)` or Rspack's SWC minimizer runs `compress.passes: 3`.
- The plural rules are indexed on first use instead of when the module loads, and the translator merges loaded lines through `addLines`, so importing lang runs no setup code.
