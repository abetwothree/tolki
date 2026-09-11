---
"@tolki/utils": minor
---

Add `phpArrayKey(key)`: the key PHP stores for an array key string. A canonical decimal integer string ("10", "-1") becomes a number; every other string ("01", "1.5", " 1") stays as it is.

Add `toPhpKeyString(value)`: the string key PHP's `array_combine` stores a value under. `null`, `undefined` and `false` become `""`, `true` becomes `"1"`, and anything else is stringified.

Add `isPlainObject(value)`: whether a value is a plain object, one whose prototype is `Object.prototype` or `null`. Arrays, class instances and built-ins such as `Date` and `Map` are not.

Add `arrayableItems(items)`: the keyed twin of `arrayableValues`. It normalizes an operand the way Laravel's `getArrayableItems()` does, returning its entries as a plain object: nullish becomes `{}`, an Enumerable/Arrayable-like object unwraps via `all()`/`toArray()`/`toJSON()`, and a Map, list or other iterable becomes an object.
