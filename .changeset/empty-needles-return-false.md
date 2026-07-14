---
"@tolki/str": patch
---

Fixed `containsAll()` and `Stringable#containsAll()` incorrectly returning `true` when given an empty list of needles to search for. Since there's nothing to confirm is present, they now correctly return `false`.
