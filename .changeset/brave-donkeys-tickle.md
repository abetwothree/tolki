---
"@tolki/utils": minor
---

Added an `isIterable()` check that tells you whether a value can be looped over with `for...of`, such as an array, a `Set`, a `Map`, or a generator. Strings are deliberately reported as not iterable so they keep being treated as single values rather than as a list of characters.
