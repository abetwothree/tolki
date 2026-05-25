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

Also fixes two type-safety bugs in `Collection.reduce` and `Collection.reduceWithKeys`:

- `reduce(callback)` on an empty collection with no initial value now throws `TypeError: Reduce of empty collection with no initial value`, matching `Array.prototype.reduce` behavior. Previously it silently returned `undefined` while the overload claimed `TValue`.
- `reduceWithKeys(callback)` with no initial now defaults to `null` (matching PHP's `$initial = null`), returning `null` on empty collections instead of throwing. This aligns with the existing `TValue | null` overload signature.
