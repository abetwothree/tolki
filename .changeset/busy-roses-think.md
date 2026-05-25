---
"@tolki/str": minor
"@tolki/collection": patch
---

Add `normalize` option to `studly` and `pascal`

`studly()`, `pascal()`, and the corresponding `Stringable` methods now accept an optional `normalize` boolean parameter (default `false`). When `true`, all-uppercase words (acronyms) at word boundaries are lowercased before conversion, so each acronym is treated as a single word:

```ts
studly("CBOR"); // → "CBOR"  (default behavior unchanged)
studly("CBOR", true); // → "Cbor"
studly("ALL_CAPS", true); // → "AllCaps"
pascal("ALL_CAPS", true); // → "AllCaps"

Str.of("CBOR").studly(true).toString(); // → "Cbor"
Str.of("ALL_CAPS").pascal(true).toString(); // → "AllCaps"
```

Also updates the `reduce` and `reduceWithKeys` JSDoc in `Collection` to clarify that the initial value type is included in the return type when the collection is empty (aligns with Laravel's `@return TReduceInitial|TReduceReturnType` documentation update).
