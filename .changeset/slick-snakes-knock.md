---
"@tolki/str": patch
---

## Improve URL validation and deduplicate API

Enhance Str.isUrl to reject dot-only hosts and URLs with empty authority (e.g. http:///path), allow single-label hosts and punycode, and simplify regex handling (remove unnecessary try/catch). Stringable.deduplicate add tests for deduplication with an array of characters.
