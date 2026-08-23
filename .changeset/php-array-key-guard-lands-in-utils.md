---
"@tolki/utils": minor
---

Add `isPhpArrayKey()` and `defineKey()`, the two helpers `@tolki/arr` and `@tolki/obj` need to build PHP-compatible flipped keys. Both previously existed as private copies in each of those packages.

`isPhpArrayKey()` reports whether a value is one PHP would accept as an array key.

- PHP array keys are strings and integers in the inclusive range `[-2^63, 2^63 - 1]`. Anything else — floats, booleans, `null`, `undefined`, arrays, objects, functions, and symbols — is rejected, so callers never build a key PHP could not produce.
- The lower bound is inclusive, so `PHP_INT_MIN` (exactly `-2^63`) is accepted. The upper bound stays exclusive because `PHP_INT_MAX` is not representable as a JavaScript double: `2^63 - 1` rounds to `2^63`, which makes the largest candidate that can reach the check a valid key already.
- The copies this replaces used a magnitude test (`Math.abs(value) < 2 ** 63`) that rejected `PHP_INT_MIN`, causing `flip()` to drop a value that PHP's `array_flip()` keeps.

`defineKey()` defines an own enumerable property on an object without going through a setter.

- A key such as `__proto__` becomes a real own key rather than reaching `Object.prototype` through the inherited setter, so building a result object out of untrusted values cannot pollute the prototype.
- The property is writable and configurable, so it otherwise behaves like plain assignment.
