---
"@tolki/str": patch
---

- Unused calls to str's side-effect-free helpers now drop out of bundles, including the string transforms, matchers, padding and trimming helpers, case converters, the `random`, `uuid` and `ulid` generators, `markdown`, `slug`, the pluralizer, and the `str` and `of` factories.
- `createRandomStringsUsing`, `createRandomStringsUsingSequence`, `createRandomStringsNormally`, `createUuidsUsing`, `createUuidsUsingSequence`, `createUuidsNormally`, `freezeUuids`, `createUlidsUsing`, `createUlidsUsingSequence`, `createUlidsNormally`, `freezeUlids`, `flushCache`, `resetFactoryState` and `inflector` write module state, so a call to them is always kept.
- In Vite 8 (Rolldown) and Rspack, an unused call to a helper whose module pulls a side-effectful dependency can leave that dependency behind unless the call is written `/* @__PURE__ */ fn(...)`. These are `uuid`, `uuid7`, `ulid`, `slug`, `ascii`, `markdown`, `inlineMarkdown`, `markDownRenderer`, `str`, `of`, `plural`, `singular`, `counted`, `isPlural`, `isSingular`, `pluralStudly`, `pluralPascal`, `matchCase` and `uncountable`. See the "Bundling and Tree-Shaking" page (https://tolki.abe.dev/tree-shaking.html) for the cause of each.
