---
"@tolki/enum": minor
---

Add `values()` and `keys()`, which return a published enum's case values and case names in PHP's case order, typed as the enum's value and name unions. They read the `_cases` metadata, so they return an empty array for an enum published without it. A unit enum's values are its case names.
