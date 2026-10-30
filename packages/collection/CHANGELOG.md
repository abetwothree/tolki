# @tolki/collection

## 1.0.1

### Patch Changes

- 5a9be1d: `@tolki/collection/collection` now loads in tools that resolve imports with `require` conditions, such as a Vite config that loads as CommonJS. The export had only an `import` condition, so those tools failed with "This package is ESM only but it was tried to load by `require`".
- Updated dependencies [5a9be1d]
- Updated dependencies [666c535]
- Updated dependencies [5a9be1d]
- Updated dependencies [5a9be1d]
  - @tolki/data@1.0.2
  - @tolki/enum@1.1.5
  - @tolki/path@1.0.1
  - @tolki/utils@1.6.3

## 1.0.0

### Major Changes

- ee73411: Finally releasing this `@tolki/collection` package

### Patch Changes

- Updated dependencies [e332aa3]
- Updated dependencies [ee73411]
- Updated dependencies [ee73411]
- Updated dependencies [e9fb109]
- Updated dependencies [d6942cc]
- Updated dependencies [886f9ad]
  - @tolki/types@1.9.0
  - @tolki/data@1.0.0
  - @tolki/path@1.0.0
  - @tolki/enum@1.1.3
  - @tolki/utils@1.6.0
