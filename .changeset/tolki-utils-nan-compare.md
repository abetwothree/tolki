---
"@tolki/utils": patch
---

`compareValues` now answers `1` when `NaN` meets a number or a string, from either side, as PHP's `<=>` does with `NAN`. It used to answer `0` against a number.
