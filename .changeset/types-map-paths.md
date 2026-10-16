---
"@tolki/types": patch
---

Dot-path types now see through a `Map`, the way the `@tolki` helpers read one. A path that passes through a `Map`, such as `"settings.theme"` on `{ settings: new Map<string, string>() }`, now types the Map's value instead of `null`, and writing through one keeps it typed as a `Map`.

- `ResolveKey` types a key on a `Map` as the Map's value, or `undefined` because the Map may not hold it, instead of one of the Map's own members: `ResolveKey<Map<string, number>, "size">` is now `number | undefined`, not the type of `size`. `ResolvePath`, `GetFieldType` and `ArrayResolvePath` follow it at every step of a path.
- `ObjectResolvePath` reads through a `Map` at any step: `ObjectResolvePath<{ m: Map<string, number> }, "m.n">` is `number | null`.
- `ObjectPathValue` reaches a `Map`'s values and what they hold, instead of the Map's methods.
- `SetObjectPath` keeps a `Map` on the path a `Map` that holds the new key: `SetObjectPath<{ m: Map<string, number> }, "m.n", true>` is `{ m: Map<string | number, number | true> }`.
