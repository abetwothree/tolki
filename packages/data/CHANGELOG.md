# @tolki/data

## 1.0.3

### Patch Changes

- 278e39a: - Unused calls to data's side-effect-free helpers now drop out of bundles in Vite, Rollup, webpack and Rspack, as arr's and obj's do.
  - `dataPop`, `dataShift`, `dataUnshift` and `dataSplice` can change the array or object you pass, so a call to them is always kept.
  - `dataAdd` and `dataPush` on arrays no longer change the caller's nested data for unusual keys, inherited from arr's fix.
  - The helpers' TypeScript types are unchanged.
  - esbuild keeps an unused call unless the call site is written `/* @__PURE__ */ fn(...)`.
- 7483429: - `undot` no longer changes the nested arrays or objects of its input, matching Laravel.
  - `dataUndot` and `Collection#undot` inherit this, so they no longer write into their input either.
- Updated dependencies [eaa95c6]
- Updated dependencies [58202f3]
- Updated dependencies [3a71e95]
- Updated dependencies [6a9ea1d]
- Updated dependencies [7483429]
  - @tolki/arr@1.0.2
  - @tolki/obj@1.0.2
  - @tolki/utils@1.6.4

## 1.0.2

### Patch Changes

- 5a9be1d: `@tolki/data/data` now loads in tools that resolve imports with `require` conditions, such as a Vite config that loads as CommonJS. The export had only an `import` condition, so those tools failed with "This package is ESM only but it was tried to load by `require`".
- Updated dependencies [5a9be1d]
- Updated dependencies [5a9be1d]
- Updated dependencies [5a9be1d]
  - @tolki/arr@1.0.1
  - @tolki/obj@1.0.1
  - @tolki/utils@1.6.3

## 1.0.1

### Patch Changes

- eb563dc: Bundlers can now leave out the `@tolki/data` helpers an app never imports. Before, esbuild kept every helper, and most of `@tolki/arr` and `@tolki/obj` with them, as soon as one was imported: `dataGet` alone bundled to about 52 KB minified, and now to about 7 KB.
- Updated dependencies [adee162]
- Updated dependencies [40d89eb]
  - @tolki/types@1.10.0
  - @tolki/utils@1.6.1

## 1.0.0

### Major Changes

- ee73411: Finally releasing this `@tolki/data` package

### Patch Changes

- Updated dependencies [e332aa3]
- Updated dependencies [ee73411]
- Updated dependencies [ee73411]
- Updated dependencies [d6942cc]
- Updated dependencies [886f9ad]
  - @tolki/types@1.9.0
  - @tolki/arr@1.0.0
  - @tolki/obj@1.0.0
  - @tolki/utils@1.6.0
