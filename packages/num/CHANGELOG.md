# @tolki/num

## 2.3.0

### Minor Changes

- 56892d5: Locales can now be written the way Laravel writes them, such as `pt_BR`, as well as `pt-BR`, and `ordinal()` follows Laravel's per-locale rules (#137).
  - **Breaking:** functions throw an `Error` with Laravel's message for a locale the runtime has no data for, such as `xx`, where they used to format in the host's locale. `spell(42, "xx-XX")` no longer falls back to English. Pass a locale the runtime knows.
  - **Breaking:** `ordinal()` follows Laravel's per-locale rules: `ordinal(1, "pt_BR")` is `"1º"`, `ordinal(1, "de")` is `"1."`, negatives use the minus sign `−`, and large numbers are grouped (`"1,000th"`). Update any code or tests that compare against the old English-only output. It now needs `Intl.PluralRules` and `Intl.Locale`, and throws a `TypeError` without them instead of falling back to English.
  - **Breaking:** `ordinal()` rounds a fraction as Laravel does (`ordinal(1.5)` is `"2st"`), writes `NaN` and infinity as the locale does (`"NaN"`, `"∞"`), and gives `"-0th"` for `-0`.
  - **Breaking:** `spell()` and `spellOrdinal()` use the default locale set by `useLocale()` instead of always English. Pass the locale explicitly to keep English.
  - Every function that takes a locale reads `pt_BR` as well as `pt-BR`. `normalizeLocalesUsing()` changes that conversion, and `normalizeLocalesUsing(null)` passes locales to `Intl` unchanged.
  - `localeTag()` is exported: it turns `pt_BR` into `pt-BR` for `Intl` and `toLocaleDateString()`, and `normalizeLocalesUsing(localeTag)` restores the default conversion.

### Patch Changes

- f6a408b: Fixes type errors in projects that use `moduleResolution` `node16` or `nodenext`: the published declaration files now name every file they import, so every export resolves (#143). Each export in `package.json` also lists its types first.
- Updated dependencies [56892d5]
- Updated dependencies [f6a408b]
- Updated dependencies [15d1693]
  - @tolki/utils@1.7.0

## 2.2.6

### Patch Changes

- c9c059e: - Unused calls to num's side-effect-free helpers now drop out of bundles, including the formatters, parsers, `ordinal`, `percentage`, `currency`, `fileSize`, `forHumans`, `summarize`, `clamp`, `pairs`, `trim`, the duration helpers, `defaultLocale`, `defaultCurrency`, and the async `spell` and `spellOrdinal`.
  - `useLocale` and `useCurrency` write the module defaults, and `withLocale` and `withCurrency` run a callback around a temporary swap of them, so a call to any of the four is always kept.
  - In Rspack, an unused call to `spell` or `spellOrdinal` can leave the loader code for its dynamic `import()` behind unless the call is written `/* @__PURE__ */ spell(...)`.
  - esbuild keeps an unused call unless the call site is written `/* @__PURE__ */ fn(...)`.
- Updated dependencies [6a9ea1d]
  - @tolki/utils@1.6.4

## 2.2.5

### Patch Changes

- ca6b4e3: `@tolki/num` no longer bundles its own copy of to-words' English locale. `spell()` and `spellOrdinal()` now load it from the installed `to-words` package, like every other locale.
- 5a9be1d: `@tolki/num/num` and `@tolki/num/speller` now load in tools that resolve imports with `require` conditions, such as a Vite config that loads as CommonJS. The exports had only an `import` condition, so those tools failed with "This package is ESM only but it was tried to load by `require`".
- Updated dependencies [5a9be1d]
  - @tolki/utils@1.6.3

## 2.2.4

### Patch Changes

- 6d5d090: `pairs()` now throws an `InvalidArgumentException` when `by` is `0`, the same error and message Laravel uses. It is still an `Error`, so code that already catches errors from `pairs()` keeps working, and you can import `InvalidArgumentException` from `@tolki/utils` to check for it.
- df5f685: `pairs()` no longer drops the last value of the range when the final step lands exactly on it, matching a recent fix in Laravel. For example, `pairs(20, 10)` now returns `[[0, 9], [10, 19], [20, 20]]` instead of stopping at `[10, 19]`. Ranges whose last pair already ends on the upper value are unchanged, so `pairs(20, 10, 0, 0)` is still `[[0, 10], [10, 20]]`.
- Updated dependencies [886f9ad]
  - @tolki/utils@1.6.0

## 2.2.3

### Patch Changes

- 6032c51: `format()`, `percentage()` and `currency()` no longer put a minus sign in front of a number that rounds to zero, matching a recent fix in Laravel. For example, `format(-0.4, 0)` now returns `"0"` instead of `"-0"`, `percentage(-0.4)` returns `"0%"`, and `currency(-0.001)` returns `"$0.00"` instead of `"-$0.00"`. Numbers that still round to something below zero keep their sign, so `currency(-0.006)` is still `"-$0.01"`. `fileSize()` builds on `format()`, so it gets the same fix: `fileSize(-0.4)` now returns `"0 B"` instead of `"-0 B"`.
- Updated dependencies [4fecd5b]
  - @tolki/utils@1.4.0

## 2.2.2

### Patch Changes

- e11f2fc: Fixed `summarize()`, and the `forHumans()` and `abbreviate()` helpers built on it, turning very small numbers into large ones. Any value below `0.001` was being scaled up instead of down, so `abbreviate(0.005)` returned `"5"` and `forHumans(0.001)` returned `"1"`. All three now round these values down to `"0"`, and still show the real value when you ask for more precision, so `abbreviate(0.005, 3)` returns `"0.005"`.
- Updated dependencies [e11f2fc]
  - @tolki/utils@1.1.0

## 2.2.1

### Patch Changes

- ffe4476: Fixed `forHumans()` and `abbreviate()` sometimes printing `"-0"` for small negative numbers that round down to zero at the requested precision. For example, `forHumans(-0.4)` now returns `"0"` instead of `"-0"`.

## 2.2.0

### Minor Changes

- dd82d49: Format non-finite values (`Infinity`, `-Infinity`, `NaN`) in `fileSize`, `forHumans`, and `abbreviate` instead of coercing them to `0`. Matches Laravel's `Number` class, which now renders these as `"∞ B"`, `"-∞ B"`, `"NaN B"`, `"∞"`, `"-∞"`, and `"NaN"` respectively.

## 2.1.0

### Minor Changes

- 13c8be0: - `fileSize()` now correctly handles negative byte values (e.g. `-2048` → `"-2 KB"`)
  - `pairs()` now throws an `Error` when `by` is `0`, and treats negative `by` values the same as positive ones
  - `trim()` now returns `Infinity`, `-Infinity`, and `NaN` as-is instead of converting them to `null`

## 2.0.5

### Patch Changes

- 3a69d44: Update Num.abbreviate formatting rounds up to >= 1000 (e.g., 999.5 rounds to 1,000), promote to the next unit tie

## 2.0.4

### Patch Changes

- e8d5904: Framework sync changes

## 2.0.3

### Patch Changes

- 24ca41d: Heading styling on copied documentation to each package readme.md

## 2.0.2

### Patch Changes

- c08e209: Auto add documentation from VitePress

## 2.0.1

### Patch Changes

- b108941: Fix circular dependency bugs by importing from relative files rather than the packages index.js entry point

## 2.0.0

### Major Changes

- 9aac0bb: ## BREAKING: Async spell and spellOrdinal with to-words v5

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

## 1.0.4

### Patch Changes

- df3cd9a: Small fixes, tests, typings, and make sure proper dependencies are configured
- Updated dependencies [df3cd9a]
  - @tolki/utils@1.0.1

## 1.0.3

### Patch Changes

- 0c155ab: Fully tested and some refactoring

## 1.0.2

### Patch Changes

- Add documentation links to tolki num methods

## 1.0.1

### Patch Changes

- Document links to functions and sync Laravel framework changes

## 1.0.0

### Major Changes

- First release of Tolki JS 🎉

### Patch Changes

- Updated dependencies
  - @tolki/utils@1.0.0
