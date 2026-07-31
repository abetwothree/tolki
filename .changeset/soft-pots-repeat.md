---
"@tolki/types": minor
---

Added a `DataIterableItems` type for helpers that accept more than plain arrays and objects. It covers the same values as `DataItems` plus a `Map` for keyed items and any other iterable, such as a `Set` or a generator, for positional items.
