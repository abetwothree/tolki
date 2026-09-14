---
"@tolki/types": minor
---

Add object-side type helpers, re-exported from the package root, used by `@tolki/obj`'s precise overloads.

- Path resolution: `ObjectResolvePath<T, P, TDefault>` resolves a dot path within an object and adds `TDefault` exactly when the path may not exist (an optional or nullable segment, an index signature, an array index, or an undeclared key). `ObjectPathValue<T>` is every value a path can reach, used for widened `string` paths.
- Keys and values: `ObjectValue<T>`, `PhpArrayKey<K>` (a canonical integer string key becomes a number, as in PHP), `ObjectKey<T>`.
- Result shapes: `ReindexedObject`, `TruthyObject`, `NonNullableObject`, `FlipObject`, `PrefixKeys`, `MergeObjects`, `SpreadObjects`, `DeepMergeObjects`, `SetObjectPath`, `OmitObjectPath`, `OmitObjectPaths`, `ObjectDeepPartial`, `RenumberedObject`, `UndotObjectValue`, `ObjectFlatValue`, `EnsureObject`.
- Utilities: `NonObjectItems`, `Simplify`, `UnionToIntersection`, and `ArrayableItems<T>`: the entries `arrayableItems()` from `@tolki/utils` reads from an operand (a Collection-like unwrapped, a list or Map keyed, `null` empty).
- Internal helpers: `objects.d.ts` and `path-resolve.d.ts` also declare the types these are built from: `PhpFalsyValue`, `PlainObjectOf`, `MapItems`, `SpreadItems`, `OwnItems`, `UnionOperands`, `RequiredObjectKeys`, `IndexKeyOf`, `KeyPresence`, `PresentValue`, `MergedEntries`, `OverlayObjects`, `ObjectDepth`, `MergeKind`, `ListOrObject`, `DeepMergeValue`, `DeepMergeSpread`, `DeepOverlayValue`, `DeepOverlayObjects`, `FlatLeafValue`, `ObjectPathDepth`, `KnownObjectKeys`, `ObjectIndexStep`, `ObjectPathStep`, `ObjectSegmentMissing`, `ObjectPathWalk`, `ObjectPathLeaf`, `ObjectPathTop`, `ObjectKeyStep`, `ObjectPathLiteral` and `IsBareObject`. A `.d.ts` module exports every top-level type, so they can be imported from the package root, but they are implementation details of the helpers above, not supported API.
