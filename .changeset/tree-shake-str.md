---
"@tolki/str": patch
---

- Unused calls to str's side-effect-free helpers now drop out of bundles, including the string transforms, matchers, padding and trimming helpers, case converters, the `random`, `uuid` and `ulid` generators, `markdown`, `slug`, the pluralizer, and the `str` and `of` factories.
- `createRandomStringsUsing`, `createRandomStringsUsingSequence`, `createRandomStringsNormally`, `createUuidsUsing`, `createUuidsUsingSequence`, `createUuidsNormally`, `freezeUuids`, `createUlidsUsing`, `createUlidsUsingSequence`, `createUlidsNormally`, `freezeUlids`, `flushCache`, `resetFactoryState` and `inflector` write module state, so a call to them is always kept.
- In Vite 8 (Rolldown) and Rspack, an unused call to uuid, ulid, markdown, slug, the pluralizer, `str` and `of` can leave their dependency code behind unless the call is written `/* @__PURE__ */ fn(...)`.
