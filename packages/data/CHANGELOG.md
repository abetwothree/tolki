# @tolki/data

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
