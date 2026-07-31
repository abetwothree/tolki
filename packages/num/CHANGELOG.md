# @tolki/num

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
