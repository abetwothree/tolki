---
"@tolki/types": minor
---

Add four array-related type helpers, re-exported from the package root.

- `NonNullableArray<T>` - removes `null` from an array's element type. Used by helpers that filter null values out of an array while preserving the rest of the element type (e.g. `Arr.whereNotNull`).
- `TruthyArray<T>` - removes the values PHP treats as falsy (`null`, `undefined`, `false`, `0`, `""`) from an array's element type. Used by helpers that filter falsy values out of an array (e.g. `Arr.filter` with no callback).
- `SortSpec<TValue>` - a single sort descriptor accepted by array sort helpers: a dot-notated key path, a `[key, direction]` tuple, or a comparator function. Used by `Arr.sort` and `Arr.sortDesc`'s multi-key sorting overloads.
- `PluckValue<TItem, TPath>` - resolves the value type produced by plucking a literal path (including array-segment and `*` wildcard forms) out of each element of an array. Used by `Arr.pluck`'s literal-path overloads.
