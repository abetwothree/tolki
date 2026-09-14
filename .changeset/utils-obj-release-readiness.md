---
"@tolki/utils": minor
---

Add `phpArrayKey(key)`: the key PHP stores for an array key. A canonical decimal integer string ("10", "-1") becomes a number; every other string ("01", "1.5", " 1") stays as it is. Any other value is cast the way PHP casts an array offset: `null` becomes `""`, a boolean `0` or `1`, and a float is truncated toward zero (`INF` and `NAN` become `0`).

Add `toPhpKeyString(value)`: the string key PHP's `array_combine` stores a value under. `null`, `undefined` and `false` become `""`, `true` becomes `"1"`, a number prints the way PHP's `(string)` cast prints it (`INF`, `-0`, `1.0E+21`, 14 significant digits), and anything else is stringified.

Fix `strictEqual(a, b)`: two plain objects holding the same entries in a different key order are no longer equal, matching PHP's `===` on arrays.

Add `isPlainObject(value)`: whether a value is a plain object, one whose prototype is `Object.prototype` or `null`. Arrays, class instances and built-ins such as `Date` and `Map` are not.

Add `renumberPhpIntegerKeys(entries)`: renumber every key PHP stores as an integer to a fresh 0-based sequence, in the order given, as `array_shift`, `array_splice` and `array_unshift` do. Unlike `reindexIntegerKeys`, a negative key such as `"-1"` counts too.

Add `arrayableItems(items)`: the keyed twin of `arrayableValues`. It normalizes an operand the way Laravel's `getArrayableItems()` does, returning its entries as a plain object: nullish becomes `{}`, an Enumerable/Arrayable-like object unwraps via `all()`/`toArray()`/`toJSON()`, a Map, list or other iterable becomes an object, and a WeakMap or WeakSet, whose entries can't be read, becomes `{}`.
