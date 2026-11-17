---
"@tolki/arr": patch
---

Unused calls to arr's side-effect-free helpers now drop out of bundles, including the getters, filters, sorts, set operations and path readers and writers that return a copy.

- `pop`, `shift`, `unshift` and `splice` change the array you pass, so a call to them is always kept.
- arr no longer builds its sort comparator or reads the `SortDirection` enum at import time.
