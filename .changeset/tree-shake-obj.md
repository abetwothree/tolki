---
"@tolki/obj": patch
---

- Unused calls to obj's side-effect-free helpers now drop out of bundles, including the getters, filters, sorts, set operations and path readers and writers that return a copy.
- `pop`, `shift`, `unshift` and `splice` change the object or Map you pass, so a call to them is always kept.
- obj no longer builds its sort comparator or reads the `SortDirection` enum at import time.
