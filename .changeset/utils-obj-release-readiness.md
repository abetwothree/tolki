---
"@tolki/utils": major
---

**Breaking.** `compareValues(a, b)` orders two arrays or objects by PHP's array-comparison rule instead of by their `JSON.stringify` form: the operand with fewer entries sorts first, and only when the counts match are the entries compared one by one over the left operand's own keys, recursing through `compareValues`. A key the right operand lacks makes the pair uncomparable, which PHP answers `1` for from either side. Every sort in this monorepo runs through this comparator, so results change: `[{ id: 2 }, { id: 10 }, { id: 1 }]` now sorts to `[{ id: 1 }, { id: 2 }, { id: 10 }]` rather than to the order of the three JSON strings. Cyclic input no longer throws — a pair the walk is already comparing ties, where PHP raises `Error: Nesting level too deep`. Two divergences from PHP remain, both as before: an array against a scalar keeps JavaScript's coercion rather than sorting above every scalar, and an exotic object (`Date`, `Map`, `Set`) has no own enumerable keys, so any two of them tie.

Add `phpArrayKey(key)`: the key PHP stores for an array key. A canonical decimal integer string ("10", "-1") becomes a number; every other string ("01", "1.5", " 1") stays as it is. Any other value is cast the way PHP casts an array offset: `null` becomes `""`, a boolean `0` or `1`, and a float is truncated toward zero (`INF` and `NAN` become `0`).

Add `toPhpKeyString(value)`: the string key PHP's `array_combine` stores a value under. `null`, `undefined` and `false` become `""`, `true` becomes `"1"`, a number prints the way PHP's `(string)` cast prints it (`INF`, `-0`, `1.0E+21`, 14 significant digits), and anything else is stringified.

Fix `strictEqual(a, b)`: two plain objects holding the same entries in a different key order are no longer equal, matching PHP's `===` on arrays.

Add `isPlainObject(value)`: whether a value is a plain object, one whose prototype is `Object.prototype` or `null`. Arrays, class instances and built-ins such as `Date` and `Map` are not.

Add `isPhpAccessible(value)`: whether a value carries array entries rather than object state, which is what PHP's `Arr::accessible` asks. An array, a plain object and a `Map` are accessible; a `Date`, a `Set`, a `WeakMap`, a `RegExp` or a class instance is not, because its state does not live on its own enumerable keys — PHP rejects a `DateTime` for the same reason.

Add `renumberPhpIntegerKeys(entries)`: renumber every key PHP stores as an integer to a fresh 0-based sequence, in the order given, as `array_shift`, `array_splice` and `array_unshift` do. Unlike `reindexIntegerKeys`, a negative key such as `"-1"` counts too.

Add `arrayableItems(items)`: the keyed twin of `arrayableValues`. It normalizes an operand the way Laravel's `getArrayableItems()` does, returning its entries as a plain object: nullish becomes `{}`, an Enumerable/Arrayable-like object unwraps via `all()`/`toArray()`/`toJSON()`, a Map, list or other iterable becomes an object, and a WeakMap or WeakSet, whose entries can't be read, becomes `{}`.
