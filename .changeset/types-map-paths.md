---
"@tolki/types": patch
---

Dot-path types now see through a `Map`. A path that passes through a `Map`, such as `"settings.theme"` on `{ settings: new Map<string, string>() }`, now types the Map's value instead of `null`, and writing through one keeps it typed as a `Map`.
