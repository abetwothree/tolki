# @tolki/str

## 1.0.8

### Patch Changes

- 298c3cd: isUrl regex update (str.ts:677): Updated the domain matching pattern in the URL validation regex to properly handle punycode TLDs.

## 1.0.7

### Patch Changes

- 2bbdea8: Add some type tests and overrides to str functions that can return single strings or array of strings based on input(s)

## 1.0.6

### Patch Changes

- b108941: Fix circular dependency bugs by importing from relative files rather than the packages index.js entry point
- Updated dependencies [b108941]
  - @tolki/num@2.0.1

## 1.0.5

### Patch Changes

- da7a5bf: ## Improve URL validation and deduplicate API

  Enhance Str.isUrl to reject dot-only hosts and URLs with empty authority (e.g. http:///path), allow single-label hosts and punycode, and simplify regex handling (remove unnecessary try/catch). Stringable.deduplicate add tests for deduplication with an array of characters.

- Updated dependencies [9aac0bb]
  - @tolki/num@2.0.0

## 1.0.4

### Patch Changes

- df3cd9a: Small fixes, tests, typings, and make sure proper dependencies are configured
- Updated dependencies [df3cd9a]
  - @tolki/utils@1.0.1
  - @tolki/num@1.0.4

## 1.0.3

### Patch Changes

- c4d3afb: Fully tested, some refactoring, and TypeScript function overloads to better infer function reponses when it's either a string or an array of strings that can be returned

## 1.0.2

### Patch Changes

- Documentation links to str functions

## 1.0.1

### Patch Changes

- Document links to functions and sync Laravel framework changes
- Updated dependencies
  - @tolki/num@1.0.1

## 1.0.0

### Major Changes

- First release of Tolki JS 🎉

### Patch Changes

- Updated dependencies
  - @tolki/num@1.0.0
  - @tolki/utils@1.0.0
