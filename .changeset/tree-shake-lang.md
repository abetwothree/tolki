---
"@tolki/lang": patch
---

- Unused calls to lang's side-effect-free helpers now drop out of bundles, including `createLang`, `bindLang`, `createHelpers`, `choose`, `getPluralIndex`, `makeReplacements`, `normalizeLocale`, `htmlLocale`, the Vue, React and Svelte `useLang`, `getLang`, `langContext` and `LangProvider`, and the `laravelLangExport` plugin factory.
- `assertLocale` is called to throw, `setLang` writes Svelte component context, `mergeLocaleLines` writes into the translator it is given, and `readManifest` reads a file, so a call to them is always kept.
- In Rspack, an unused call to `createLang` (main and Vue entries) or to the React `LangProvider` and `useLang` can leave code behind unless the call is written `/* @__PURE__ */ fn(...)`.
- The plural rules are indexed on first use instead of when the module loads, and the translator's line merge is a static method instead of a class static block, so importing lang runs no setup code.
