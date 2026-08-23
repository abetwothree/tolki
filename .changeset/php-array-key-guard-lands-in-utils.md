---
"@tolki/utils": minor
---

Add `isPhpArrayKey()`, a type guard for values PHP would accept as an array key.

- PHP array keys are strings and integers in the inclusive range `[-2^63, 2^63 - 1]`. Anything else — floats, booleans, `null`, `undefined`, arrays, objects, functions, and symbols — is rejected, so callers never build a key PHP could not produce.
- The lower bound is inclusive, so `PHP_INT_MIN` (exactly `-2^63`) is accepted. The upper bound stays exclusive because `PHP_INT_MAX` is not representable as a JavaScript double: `2^63 - 1` rounds to `2^63`, which makes the largest candidate that can reach the check a valid key already.
- This replaces private copies that had drifted into both `@tolki/arr` and `@tolki/obj`, where a magnitude test (`Math.abs(value) < 2 ** 63`) rejected `PHP_INT_MIN` and caused `flip()` to drop a value that PHP's `array_flip()` keeps.
