---
"@tolki/num": patch
---

`@tolki/num` no longer bundles its own copy of to-words' English locale. `spell()` and `spellOrdinal()` now load it from the installed `to-words` package, like every other locale.
