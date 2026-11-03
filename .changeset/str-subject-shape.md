---
"@tolki/str": minor
---

`replace()` and `remove()` now return a result shaped like the subject, as Laravel does: an object keeps its keys, a `Map` stays a `Map`, and a collection gives back an array or an object like its `all()`.

- **Breaking:** a keyed collection subject now returns an object keyed like it, instead of an array of its values.
- A `Map` subject no longer turns each entry into a `"key,value"` string, and a plain-object subject no longer returns an empty array.
