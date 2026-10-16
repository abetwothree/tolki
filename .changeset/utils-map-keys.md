---
"@tolki/utils": minor
---

New helpers for reading and writing a `Map` the way PHP reads and writes an array. `readMapKey`, `writeMapKey` and `deleteMapKey` treat `1` and `"1"` as the same key, and an overwrite keeps the key where it was. `nextIntegerKey` finds the key PHP would give the next value you append, one past the highest whole-number key.
