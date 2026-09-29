---
"@tolki/types": minor
---

New helper types for the array and collection packages, and a wider `SortSpec`.

- **Breaking:** a `SortSpec` comparator may now return a boolean as well as a number, because the sort helpers now accept one. Code that reads a comparator's result as a number should check for a boolean first.
- Add `CollapsedObject`, `FlattenReach` and `FlattenItemReach`, which describe what `collapse()`, `flatten()` and `dot()` return.
- Add `SpreadArgs`, which describes the arguments a `mapSpread()` or `eachSpread()` callback receives.
- Deprecate `ProxyTarget` and `PropertyName`. Nothing uses them any more, and the next major version removes them.
